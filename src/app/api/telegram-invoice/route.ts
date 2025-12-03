
import { NextResponse } from 'next/server';
import { admin, firestore } from '@/firebase/admin';
import type { InAppPurchase, StickerPack } from '@/lib/data';
import TelegramBot from 'node-telegram-bot-api';

// Initialize the bot outside the handler to reuse the instance
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error("CRITICAL: TELEGRAM_BOT_TOKEN is not configured.");
}
// Even if token is missing, we initialize to avoid runtime errors,
// but API calls will fail, which is handled below.
const bot = new TelegramBot(botToken || 'dummy-token');

// These are your conversion rates. 1000 coins = $1 = 100 stars. So 10 coins = 1 star.
const USD_TO_STARS = 100; // $1.00 = 100 Stars
const COINS_TO_STARS = 0.1; // 1 coin = 0.1 Stars, so 10 coins = 1 Star

/**
 * A server-side utility to fetch product details from Firestore.
 * This is a more secure approach than relying on frontend data.
 */
async function getProductDetails(productId: string, purchaseType: 'inAppPurchases' | 'stickerPacks'): Promise<InAppPurchase | StickerPack | null> {
    const docRef = firestore.collection(purchaseType).doc(productId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
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

    let priceInStars: number;
    const currency = 'XTR'; // Telegram Stars currency code

    // Calculate price in Stars based on product type
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
    
    // Construct a unique payload for this transaction.
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
    console.error('Error creating invoice link:', error);
    // This helps debug by logging the actual error from the Telegram API
    const errorMessage = error.response?.body?.description || error.message || 'An unknown error occurred on the server.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
