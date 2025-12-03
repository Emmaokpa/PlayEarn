
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { admin, firestore } from '@/firebase/admin';

// Initialize the bot outside the handler to reuse the instance
const botToken = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot;
if (botToken) {
    bot = new TelegramBot(botToken);
}

export async function POST(request: Request) {
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not configured.');
    // Return 200 to prevent Telegram from resending the webhook
    return NextResponse.json({ status: 'error', message: 'Bot not configured' });
  }

  try {
    const update: TelegramBot.Update = await request.json();

    // 1. Handle Pre-Checkout Query
    if (update.pre_checkout_query) {
      console.log('Answering pre-checkout query...');
      await bot.answerPreCheckoutQuery(update.pre_checkout_query.id, true);
      console.log('Pre-checkout query answered successfully.');
      return NextResponse.json({ status: 'ok' });
    }

    // 2. Handle Successful Payment
    if (update.message?.successful_payment) {
      console.log('Processing successful payment...');
      const payment = update.message.successful_payment;
      const invoicePayload = payment.invoice_payload;

      // Example payload: "purchase-USER_ID-PRODUCT_ID-TIMESTAMP" or "vip-upgrade-USER_ID-TIMESTAMP"
      const [type, userId, productId] = invoicePayload.split('-');

      if (!type || !userId) {
        throw new Error(`Invalid invoice payload: ${invoicePayload}`);
      }
      
      const userRef = firestore.collection('users').doc(userId);

      // Securely fulfill the order using Firebase Admin SDK
      switch (type) {
        case 'vip-upgrade':
          await userRef.update({ isVip: true });
          console.log(`VIP access granted to user ${userId}`);
          break;
        case 'purchase':
          if (!productId) throw new Error(`Missing productId in payload: ${invoicePayload}`);
          
          // Fetch the product details from Firestore to get amount and type
          const productRef = firestore.collection('inAppPurchases').doc(productId);
          const productDoc = await productRef.get();
          if (!productDoc.exists) throw new Error(`Product with ID ${productId} not found.`);
          
          const product = productDoc.data();

          if (product.type === 'coins') {
              await userRef.update({ coins: admin.firestore.FieldValue.increment(product.amount) });
              console.log(`Added ${product.amount} coins to user ${userId}`);
          } else if (product.type === 'spins') {
              const spinDataRef = firestore.collection('users').doc(userId).collection('spinData').doc('spin_status');
              await spinDataRef.set({ purchasedSpinsRemaining: admin.firestore.FieldValue.increment(product.amount) }, { merge: true });
              console.log(`Added ${product.amount} spins to user ${userId}`);
          }
          break;
        case 'sticker-purchase':
           // You could add logic here to unlock a sticker pack for the user
           console.log(`User ${userId} purchased sticker pack ${productId}`);
           // e.g., await userRef.collection('unlockedStickers').doc(productId).set({ unlockedAt: serverTimestamp() });
           break;
        case 'purchase-physical':
            // For physical goods, create an order document for fulfillment
            await firestore.collection('orders').add({
              userId,
              productId,
              shippingAddress: payment.order_info,
              status: 'paid',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`New physical order created for user ${userId}`);
            break;
        default:
          console.warn(`Unhandled payload type: ${type}`);
      }
    }

    // Always return a 200 OK to Telegram to acknowledge receipt
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 OK even on errors to prevent Telegram from retrying indefinitely
    return NextResponse.json({ status: 'error', message: 'Internal server error' });
  }
}
