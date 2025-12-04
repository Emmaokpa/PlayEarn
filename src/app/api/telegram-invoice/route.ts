// File: src/app/api/telegram-invoice/route.ts

import { NextResponse } from 'next/server';
import { admin, firestore } from '@/firebase/admin';
import type { InAppPurchase, StickerPack } from '@/lib/data';

const USD_TO_STARS = 100; // Telegram's rate: $1.00 USD = 100 Stars
const COINS_TO_STARS = 0.1; // Our exchange rate: 1 coin = 0.1 Stars (so 10 coins = 1 Star)

async function getProductDetails(productId: string, purchaseType: 'inAppPurchases' | 'stickerPacks'): Promise<InAppPurchase | StickerPack | null> {
    const docRef = firestore.collection(purchaseType).doc(productId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        console.error(`Product with ID ${productId} not found in collection ${purchaseType}.`);
        return null;
    }
    return docSnap.data() as InAppPurchase | StickerPack;
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("CRITICAL: TELEGRAM_BOT_TOKEN is not configured.");
    return NextResponse.json({ error: "Bot token not configured on server." }, { status: 500 });
  }

  try {
    const { productId, purchaseType, userId } = await request.json();

    if (!productId || !purchaseType || !userId) {
      return NextResponse.json({ error: 'Missing productId, purchaseType, or userId.' }, { status: 400 });
    }

    if (purchaseType !== 'inAppPurchases' && purchaseType !== 'stickerPacks') {
      return NextResponse.json({ error: 'Invalid purchase type specified.' }, { status: 400 });
    }
    
    const product = await getProductDetails(productId, purchaseType);

    if (!product) {
      return NextResponse.json({ error: `Product with ID ${productId} not found in ${purchaseType}.` }, { status: 404 });
    }

    if (!product.name || !product.description || !product.imageUrl) {
        return NextResponse.json({ error: `Product ${productId} is missing required fields (name, description, or imageUrl).` }, { status: 500 });
    }

    let priceInStars: number;
    const currency = 'XTR'; // Telegram Stars currency code

    if (purchaseType === 'inAppPurchases') {
      const pack = product as InAppPurchase;
      priceInStars = Math.round(pack.price * USD_TO_STARS);
    } else { // 'stickerPacks'
      const pack = product as StickerPack;
      priceInStars = Math.round(pack.price * COINS_TO_STARS);
    }

    if (priceInStars <= 0) {
        return NextResponse.json({ error: 'Calculated price must be positive.' }, { status: 400 });
    }
    
    // The payload that will be sent back to our webhook upon successful payment
    const payload = `${purchaseType}-${productId}-${userId}`;

    // The arguments for the Telegram API call
    const invoiceArgs = {
      title: product.name,
      description: product.description,
      payload: payload,
      currency: currency,
      prices: JSON.stringify([{ label: product.name, amount: priceInStars }]), // `prices` must be a JSON-serialized string
      photo_url: product.imageUrl,
      photo_width: 600,
      photo_height: 400,
    };
    
    const apiUrl = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;

    // Direct fetch call to the Telegram API
    const telegramResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceArgs),
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
        // If Telegram returns an error, forward it
        throw new Error(`Telegram API Error: ${telegramResult.description || 'Unknown error'}`);
    }
    
    // The result from Telegram is the invoice URL
    const invoiceUrl = telegramResult.result;
    
    return NextResponse.json({ success: true, invoiceUrl: invoiceUrl });

  } catch (error: any) {
    console.error('[API CATCH BLOCK] An error occurred:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred on the server.' }, { status: 500 });
  }
}
