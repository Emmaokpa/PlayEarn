// File: src/app/api/telegram-invoice/route.ts

import { NextResponse } from 'next/server';
import { firestore } from '@/firebase/admin';
import type { InAppPurchase, StickerPack } from '@/lib/data';

const USD_TO_STARS = 100; // $1.00 = 100 Stars
const COINS_TO_STARS = 0.1; // 1 coin = 0.1 Stars, so 10 coins = 1 Star

async function getProductDetails(productId: string, purchaseType: 'inAppPurchases' | 'stickerPacks'): Promise<InAppPurchase | StickerPack | null> {
    const docRef = firestore.collection(purchaseType).doc(productId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        return null;
    }
    return docSnap.data() as InAppPurchase | StickerPack;
}

export async function POST(request: Request) {
  console.log('[API START] Received request for telegram-invoice.');
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

    const product = await getProductDetails(productId, purchaseType);

    if (!product) {
      return NextResponse.json({ error: `Product with ID ${productId} not found.` }, { status: 404 });
    }
    
    if (!product.name || !product.description || !product.imageUrl) {
        return NextResponse.json({ error: `Product ${productId} is missing required fields.` }, { status: 500 });
    }

    let priceInStars: number;
    if (purchaseType === 'inAppPurchases') {
      priceInStars = Math.round((product as InAppPurchase).price * USD_TO_STARS);
    } else {
      priceInStars = Math.round((product as StickerPack).price * COINS_TO_STARS);
    }
    
    if (priceInStars <= 0) {
        return NextResponse.json({ error: 'Calculated price must be positive.' }, { status: 400 });
    }

    const payload = `${purchaseType}-${productId}-${userId}-${Date.now()}`;
    
    const invoiceArgs = {
      title: product.name,
      description: product.description,
      payload: payload,
      currency: 'XTR',
      prices: [{ label: product.name, amount: priceInStars }],
      photo_url: product.imageUrl,
      photo_width: 600,
      photo_height: 400,
    };
    
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;

    console.log(`[API FETCH] Calling Telegram API at ${telegramApiUrl}`);
    const telegramResponse = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceArgs),
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramResult.ok) {
        console.error('[API TELEGRAM ERROR] Failed to create invoice link:', telegramResult);
        throw new Error(telegramResult.description || 'Failed to create invoice link with Telegram.');
    }

    const invoiceUrl = telegramResult.result;
    console.log(`[API SUCCESS] Invoice link created: ${invoiceUrl}`);
    
    return NextResponse.json({ success: true, invoiceUrl });

  } catch (error: any) {
    console.error('[API CATCH BLOCK] An error occurred:', error);
    const errorMessage = error.message || 'An unknown error occurred on the server.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
