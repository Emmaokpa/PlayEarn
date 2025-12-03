import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { firestore } from '@/firebase/admin';

// Constants
const USD_TO_STARS_RATE = 113;
const COIN_TO_USD_RATE = 0.001;

// Helper to fetch product details securely from Firestore
async function getProductDetails(productId: string, purchaseType: string): Promise<any> {
  let docRef;
  if (purchaseType === 'sticker-purchase') {
    docRef = firestore.collection('stickerPacks').doc(productId);
  } else if (purchaseType === 'coins' || purchaseType === 'spins') {
    docRef = firestore.collection('inAppPurchases').doc(productId);
  } else {
    return null; // Invalid purchase type
  }

  const doc = await docRef.get();
  if (!doc.exists) {
    return null;
  }
  return doc.data();
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'Telegram bot token is not configured on the server.' }, { status: 500 });
  }

  try {
    const { productId, purchaseType, userId } = await request.json();

    if (!productId || !purchaseType || !userId) {
      return NextResponse.json({ error: 'Invalid request: Missing required parameters.' }, { status: 400 });
    }

    const product = await getProductDetails(productId, purchaseType);

    if (!product) {
      return NextResponse.json({ error: `Product with ID ${productId} not found for type ${purchaseType}.` }, { status: 404 });
    }

    let priceInStars: number;
    if (purchaseType === 'sticker-purchase') {
        const priceInUsd = product.price > 100 ? product.price * COIN_TO_USD_RATE : product.price;
        priceInStars = Math.max(1, Math.ceil(priceInUsd * USD_TO_STARS_RATE));
    } else { // coins or spins
        priceInStars = Math.max(1, Math.ceil(product.price * USD_TO_STARS_RATE));
    }

    // Determine the main payload identifier for the webhook
    const mainPayloadType = purchaseType === 'sticker-purchase' ? 'sticker-purchase' : 'purchase';
    
    // Construct the payload that Telegram will send back to our webhook
    const invoicePayloadString = `${mainPayloadType}-${userId}-${productId}-${Date.now()}`;

    const bot = new TelegramBot(botToken);
    
    const finalPayload: TelegramBot.CreateInvoiceLinkArgs = {
        title: product.name,
        description: product.description,
        payload: invoicePayloadString,
        currency: 'XTR', // Always use Stars
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
    console.error('[TELEGRAM_INVOICE_ERROR]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
