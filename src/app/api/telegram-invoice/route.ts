
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
    console.log(`[getProductDetails] Fetching product: ID=${productId}, Type=${purchaseType}`);
    const docRef = firestore.collection(purchaseType).doc(productId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        console.error(`[getProductDetails] Product with ID ${productId} not found in collection ${purchaseType}.`);
        return null;
    }
    const productData = docSnap.data() as InAppPurchase | StickerPack;
    console.log('[getProductDetails] Product data found:', productData);
    return productData;
}

export async function POST(request: Request) {
  console.log('[API /api/telegram-invoice] Received POST request.');
  if (!botToken) {
    console.error('[API Error] Bot token not configured on server.');
    return NextResponse.json({ error: "Bot token not configured on server." }, { status: 500 });
  }

  try {
    const { productId, purchaseType, userId } = await request.json();
    console.log('[API] Request body parsed:', { productId, purchaseType, userId });


    if (!productId || !purchaseType || !userId) {
      console.error('[API Error] Missing required fields in request body.');
      return NextResponse.json({ error: 'Missing productId, purchaseType, or userId.' }, { status: 400 });
    }

    if (purchaseType !== 'inAppPurchases' && purchaseType !== 'stickerPacks') {
      console.error(`[API Error] Invalid purchase type: ${purchaseType}`);
      return NextResponse.json({ error: 'Invalid purchase type specified.' }, { status: 400 });
    }
    
    const product = await getProductDetails(productId, purchaseType);

    if (!product) {
      console.error(`[API Error] Product not found for ID: ${productId}`);
      return NextResponse.json({ error: `Product with ID ${productId} not found in ${purchaseType}.` }, { status: 404 });
    }

    let priceInStars: number;
    const currency = 'XTR'; // Telegram Stars currency code

    // Calculate price in Stars based on product type
    if (purchaseType === 'inAppPurchases') {
      const pack = product as InAppPurchase;
      if (typeof pack.price !== 'number') {
        console.error(`[API Error] Invalid USD price for InAppPurchase ${productId}:`, pack.price);
        throw new Error(`Invalid USD price for product ${productId}`);
      }
      priceInStars = Math.round(pack.price * USD_TO_STARS);
    } else { // 'stickerPacks'
      const pack = product as StickerPack;
      if (typeof pack.price !== 'number') {
         console.error(`[API Error] Invalid coin price for StickerPack ${productId}:`, pack.price);
         throw new Error(`Invalid coin price for product ${productId}`);
      }
      priceInStars = Math.round(pack.price * COINS_TO_STARS);
    }
    console.log(`[API] Calculated price in stars: ${priceInStars}`);

    if (priceInStars <= 0) {
        console.error(`[API Error] Calculated price is not positive: ${priceInStars}`);
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
    
    console.log('[API] Arguments for createInvoiceLink:', invoiceArgs);
    
    const invoiceUrl = await bot.createInvoiceLink(invoiceArgs);
    
    console.log(`[API] Successfully created invoice link: ${invoiceUrl}`);
    return NextResponse.json({ success: true, invoiceUrl });

  } catch (error: any) {
    console.error('[API CATCH BLOCK] An error occurred:', error);
    const errorMessage = error.response?.body?.description || error.message || 'An unknown error occurred on the server.';
    console.error(`[API CATCH BLOCK] Final error message: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
