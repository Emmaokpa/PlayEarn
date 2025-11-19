import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

// Initialize Firebase Admin SDK
// This should only happen once.
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set');
    }
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
    // We'll throw a clearer error in the handler if admin isn't initialized.
  }
}

/**
 * Validates the Telegram initData string.
 * @param initData The initData string from the Telegram Web App.
 * @param botToken The token of your Telegram bot.
 * @returns {URLSearchParams | null} The validated data as URLSearchParams if valid, otherwise null.
 */
function validateTelegramData(initData: string, botToken: string): URLSearchParams | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  
  if (!hash) {
    return null;
  }

  params.delete('hash');
  
  // The data-check-string is all fields sorted alphabetically,
  // in the format key=<value> separated by \n
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\\n');

  try {
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
      return params;
    }
  } catch (error) {
    console.error("Error during hash validation:", error);
    return null;
  }

  return null;
}


export async function POST(req: NextRequest) {
  if (admin.apps.length === 0) {
    return NextResponse.json({ error: 'Internal Server Error: Firebase not configured.' }, { status: 500 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN environment variable not set.');
    return NextResponse.json({ error: 'Internal Server Error: Bot token not configured.' }, { status: 500 });
  }

  try {
    const { initData } = await req.json();

    if (!initData) {
      return NextResponse.json({ error: 'initData is required' }, { status: 400 });
    }

    const validatedData = validateTelegramData(initData, botToken);

    if (!validatedData) {
      return NextResponse.json({ error: 'Invalid or tampered Telegram data' }, { status: 403 });
    }

    // The user data is in a JSON string within the 'user' parameter
    const userJson = validatedData.get('user');
    if (!userJson) {
      return NextResponse.json({ error: 'User data not found in Telegram initData' }, { status: 400 });
    }
    const user = JSON.parse(userJson);
    const userId = user.id.toString();

    // Create a custom Firebase token for the user
    const firebaseToken = await admin.auth().createCustomToken(userId);

    return NextResponse.json({ token: firebaseToken });

  } catch (error: any) {
    console.error('Error in Telegram auth handler:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
