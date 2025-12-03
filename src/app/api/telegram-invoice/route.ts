
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { admin, firestore } from '@/firebase/admin';

// Conversion Rates
const COIN_TO_USD_RATE = 0.001; // 1000 coins = $1
const USD_TO_STARS_RATE = 113; // 1 USD is approx 113 Stars

async function getProductDetails(productId: string, collection: string): Promise<any> {
    const doc = await firestore.collection(collection).doc(productId).get();
    if (!doc.exists) {
        throw new Error(`Product with ID ${productId} not found in ${collection}.`);
    }
    return doc.data();
}


export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not defined.');
    return NextResponse.json({ error: 'Bot not configured.' }, { status: 500 });
  }

  try {
    const bot = new TelegramBot(botToken);
    const body = await request.json();

    // 1. Basic validation
    const { type, userId, productId } = body;
    if (!type || !userId || !productId) {
        return NextResponse.json({ error: 'Invalid request: Missing type, userId, or productId.' }, { status: 400 });
    }

    // 2. Fetch product details from Firestore based on type
    let product;
    let payloadString: string;
    let finalPayload: Omit<TelegramBot.CreateInvoiceLinkArgs, 'provider_token'>;

    if (type === 'sticker-purchase') {
        product = await getProductDetails(productId, 'stickerPacks');
        payloadString = `sticker-purchase-${userId}-${productId}-${Date.now()}`;
        
        const priceInUsd = product.price * COIN_TO_USD_RATE;
        const priceInStars = Math.max(1, Math.ceil(priceInUsd * USD_TO_STARS_RATE));

        finalPayload = {
            title: product.name,
            description: product.description,
            payload: payloadString,
            currency: 'XTR', // Stickers are digital, use Stars
            prices: [{ label: product.name, amount: priceInStars }],
        };
    } else {
        // Handle other purchase types like 'coins', 'spins', 'vip' etc.
        // For now, return an error for unhandled types.
        return NextResponse.json({ error: `Unsupported purchase type: ${type}` }, { status: 400 });
    }

    // 3. Create invoice link with Telegram
    const invoiceUrl = await bot.createInvoiceLink(finalPayload);
    
    return NextResponse.json({ invoiceUrl });

  } catch (error) {
    console.error('Failed to create invoice link:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
