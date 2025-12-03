
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { firestore } from '@/firebase/admin';

const USD_TO_STARS_RATE = 113; // 1 USD is approx 113 Stars

// Helper function to get product details from Firestore
async function getProductDetails(productId: string, collectionName: 'inAppPurchases' | 'stickerPacks'): Promise<any> {
    const doc = await firestore.collection(collectionName).doc(productId).get();
    if (!doc.exists) {
        throw new Error(`Product with ID ${productId} not found in ${collectionName}.`);
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
    if (!type || !userId) {
        return NextResponse.json({ error: 'Invalid request: Missing type or userId.' }, { status: 400 });
    }

    let product;
    let payloadString: string;
    let finalPayload: Omit<TelegramBot.CreateInvoiceLinkArgs, 'provider_token'>;
    
    // Determine the correct collection and fetch product data
    if (type === 'sticker-purchase') {
        if (!productId) return NextResponse.json({ error: 'Missing productId for sticker purchase.' }, { status: 400 });
        product = await getProductDetails(productId, 'stickerPacks');
        payloadString = `sticker-purchase-${userId}-${productId}-${Date.now()}`;
        
        const priceInStars = getPriceInStars(product.price);

        finalPayload = {
            title: product.name || 'Sticker Pack',
            description: product.description || 'A cool sticker pack.',
            payload: payloadString,
            currency: 'XTR',
            prices: [{ label: product.name, amount: priceInStars }],
            photo_url: product.imageUrl,
            photo_width: 512,
            photo_height: 512,
        };

    } else if (type === 'coins' || type === 'spins') {
        if (!productId) return NextResponse.json({ error: 'Missing productId for IAP.' }, { status: 400 });
        product = await getProductDetails(productId, 'inAppPurchases');
        payloadString = `purchase-${userId}-${productId}-${Date.now()}`;

        const priceInStars = getPriceInStars(product.price);
        
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
            photo_url: 'https://i.imgur.com/8NAw3j1.png',
            photo_width: 512,
            photo_height: 512,
        };
    } else {
        return NextResponse.json({ error: `Unsupported purchase type: ${type}` }, { status: 400 });
    }

    const invoiceUrl = await bot.createInvoiceLink(finalPayload);
    
    return NextResponse.json({ invoiceUrl });

  } catch (error) {
    console.error('[TELEGRAM_INVOICE_ERROR]', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred on the server.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getPriceInStars(price: number): number {
  if (typeof price !== 'number' || price < 0) return 1;
  const COIN_TO_USD_RATE = 0.001;
  // If price is in coins, convert to USD first
  const priceInUsd = price > 100 ? price * COIN_TO_USD_RATE : price;
  return Math.max(1, Math.ceil(priceInUsd * USD_TO_STARS_RATE));
}
