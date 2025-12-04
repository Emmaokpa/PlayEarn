
import { NextResponse } from 'next/server';
import { admin, firestore } from '@/firebase/admin';
import type { InAppPurchase, StickerPack } from '@/lib/data';
import TelegramBot from 'node-telegram-bot-api';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error("CRITICAL: TELEGRAM_BOT_TOKEN is not configured.");
}
const bot = new TelegramBot(botToken || 'dummy-token');

const USD_TO_STARS = 100; // $1.00 = 100 Stars
const COINS_TO_STARS = 0.1; // 1 coin = 0.1 Stars, so 10 coins = 1 Star

async function getProductDetails(productId: string, purchaseType: 'inAppPurchases' | 'stickerPacks'): Promise<InAppPurchase | StickerPack | null> {
    const docRef = firestore.collection(purchaseType).doc(productId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        console.error(`[getProductDetails] Product with ID ${productId} not found in collection ${purchaseType}.`);
        return null;
    }
    return docSnap.data() as InAppPurchase | StickerPack;
}

export async function POST(request: Request) {
  if (!botToken) {
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

    // Validate required fields
    if (!product.name || !product.description || !product.imageUrl) {
        return NextResponse.json({ error: `Product ${productId} is missing required fields (name, description, or imageUrl).` }, { status: 500 });
    }

    let priceInStars: number;
    const currency = 'XTR'; // Telegram Stars currency code

    if (purchaseType === 'inAppPurchases') {
      const pack = product as InAppPurchase;
      if (typeof pack.price !== 'number') {
        throw new Error(`Invalid USD price for product ${productId}`);
      }
      priceInStars = Math.round(pack.price * USD_TO_STARS);
    } else { // 'stickerPacks'
      const pack = product as StickerPack;
      if (typeof pack.price !== 'number') {
         throw new Error(`Invalid coin price for product ${productId}`);
      }
      priceInStars = Math.round(pack.price * COINS_TO_STARS);
    }

    if (priceInStars <= 0) {
        return NextResponse.json({ error: 'Calculated price must be positive.' }, { status: 400 });
    }
    
    const payload = `${purchaseType}-${productId}-${userId}-${Date.now()}`;

    const invoiceArgs: TelegramBot.CreateInvoiceLinkArgs = {
      title: product.name,
      description: product.description,
      payload: payload,
      currency: currency,
      prices: [{ label: product.name, amount: priceInStars }],
      photo_url: product.imageUrl,
      photo_width: 600,
      photo_height: 400,
    };
    
    const invoiceUrl = await bot.createInvoiceLink(invoiceArgs);
    
    return NextResponse.json({ success: true, invoiceUrl });

  } catch (error: any) {
    console.error('[API CATCH BLOCK] An error occurred:', error);
    const errorMessage = error.response?.body?.description || error.message || 'An unknown error occurred on the server.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
