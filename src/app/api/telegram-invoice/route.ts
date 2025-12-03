
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { firestore } from '@/firebase/admin';

// Constants
const USD_TO_STARS_RATE = 113; // 1 Telegram Star is approx $0.0088, so $1 is ~113 Stars
const COIN_TO_USD_RATE = 0.001; // 1000 coins = $1 USD

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('[TELEGRAM_INVOICE_ERROR] Telegram bot token is not configured on the server.');
    return NextResponse.json({ error: 'Bot not configured on server.' }, { status: 500 });
  }

  try {
    const { productId, purchaseType } = await request.json();

    if (!productId || !purchaseType) {
      return NextResponse.json({ error: 'Invalid request: Missing required parameters.' }, { status: 400 });
    }

    let collectionName: string;
    let isPricedInCoins = false;

    // Determine the correct collection based on the purchase type
    if (purchaseType === 'sticker-purchase') {
      collectionName = 'stickerPacks';
      isPricedInCoins = true;
    } else if (purchaseType === 'coins' || purchaseType === 'spins') {
      collectionName = 'inAppPurchases';
      isPricedInCoins = false;
    } else {
      return NextResponse.json({ error: `Invalid purchase type: ${purchaseType}` }, { status: 400 });
    }

    const productDoc = await firestore.collection(collectionName).doc(productId).get();

    if (!productDoc.exists) {
      console.error(`[TELEGRAM_INVOICE_ERROR] Product with ID ${productId} not found in collection ${collectionName}.`);
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const product = productDoc.data()!;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
    }

    // Defensive check for required product fields from Firestore
    if (!product.name || !product.description || !product.imageUrl || product.price === undefined) {
      console.error(`[TELEGRAM_INVOICE_ERROR] Product ${productId} is missing required fields (name, description, imageUrl, or price).`);
      return NextResponse.json({ error: 'Product configuration is incomplete on the server.' }, { status: 500 });
    }

    // Calculate price in Telegram Stars
    let priceInStars: number;
    if (isPricedInCoins) {
      // For products priced in game coins (like stickers)
      const priceInUsd = product.price * COIN_TO_USD_RATE;
      priceInStars = Math.max(1, Math.ceil(priceInUsd * USD_TO_STARS_RATE));
    } else {
      // For products priced directly in USD
      priceInStars = Math.max(1, Math.ceil(product.price * USD_TO_STARS_RATE));
    }

    // Construct the payload that Telegram will send back to our webhook upon successful payment
    const invoicePayloadString = `${purchaseType}-${userId}-${productId}-${Date.now()}`;

    const bot = new TelegramBot(botToken);

    // Explicitly construct the payload for Telegram's API
    const finalPayload: TelegramBot.CreateInvoiceLinkArgs = {
      title: product.name,
      description: product.description,
      payload: invoicePayloadString,
      currency: 'XTR', // Always use 'XTR' for Telegram Stars
      prices: [{ label: product.name, amount: priceInStars }],
      photo_url: product.imageUrl,
      photo_width: 512,
      photo_height: 512,
      need_name: false,
      need_phone_number: false,
      need_email: false,
      need_shipping_address: false,
      is_flexible: false,
    };

    const invoiceUrl = await bot.createInvoiceLink(finalPayload);

    return NextResponse.json({ invoiceUrl });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred on the server.';
    console.error('[TELEGRAM_INVOICE_ERROR]', message, error);
    // Ensure even unexpected errors return a JSON response
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
