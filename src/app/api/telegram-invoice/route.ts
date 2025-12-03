
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { firestore } from '@/firebase/admin';

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

    const { type, userId, productId } = body;
    if (!type || !userId || !productId) {
        return NextResponse.json({ error: 'Invalid request: Missing type, userId, or productId.' }, { status: 400 });
    }

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
            currency: 'XTR',
            prices: [{ label: product.name, amount: priceInStars }],
            photo_url: product.imageUrl,
            photo_width: 512,
            photo_height: 512,
        };
    } else if (type === 'coins' || type === 'spins') {
        product = await getProductDetails(productId, 'inAppPurchases');
        payloadString = `purchase-${userId}-${productId}-${Date.now()}`;

        const priceInStars = Math.max(1, Math.ceil(product.price * USD_TO_STARS_RATE));
        
        finalPayload = {
            title: product.name,
            description: product.description,
            payload: payloadString,
            currency: 'XTR',
            prices: [{ label: `${product.amount} ${product.type}`, amount: priceInStars }],
            photo_url: product.imageUrl,
            photo_width: 512,
            photo_height: 512,
        };
    } else if (type === 'vip-upgrade') {
        const VIP_PRICE_USD = 4.99;
        const priceInStars = Math.ceil(VIP_PRICE_USD * USD_TO_STARS_RATE);
        payloadString = `vip-upgrade-${userId}-${Date.now()}`;

        finalPayload = {
            title: 'VIP Subscription',
            description: 'Unlock all exclusive features and multiply your earnings!',
            payload: payloadString,
            currency: 'XTR',
            prices: [{ label: 'VIP Membership (1 Month)', amount: priceInStars }],
        };
    }
     else {
        return NextResponse.json({ error: `Unsupported purchase type: ${type}` }, { status: 400 });
    }

    const invoiceUrl = await bot.createInvoiceLink(finalPayload);
    
    return NextResponse.json({ invoiceUrl });

  } catch (error) {
    console.error('Failed to create invoice link:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
