
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
      console.log('Processing successful payment from webhook...');
      const payment = update.message.successful_payment;
      const invoicePayload = payment.invoice_payload;

      // Consistent payload format: "purchaseType|productId|userId"
      const [purchaseType, productId, userId] = invoicePayload.split('|');

      if (!purchaseType || !productId || !userId) {
        throw new Error(`Invalid invoice payload received in webhook: ${invoicePayload}`);
      }
      
      const userRef = firestore.collection('users').doc(userId);

      // Securely fulfill the order using Firebase Admin SDK
       if (purchaseType === 'inAppPurchases') {
            const productRef = firestore.collection('inAppPurchases').doc(productId);
            const productDoc = await productRef.get();
            if (!productDoc.exists) {
                throw new Error(`Product with ID ${productId} not found in inAppPurchases.`);
            }
            const pack = productDoc.data();
            
            if (pack.type === 'coins') {
                await userRef.update({ coins: admin.firestore.FieldValue.increment(pack.amount) });
                console.log(`Webhook: Awarded ${pack.amount} coins to user ${userId}.`);
            } else if (pack.type === 'spins') {
                const spinDataRef = firestore.doc(`users/${userId}/spinData/spin_status`);
                await spinDataRef.set({
                    purchasedSpinsRemaining: admin.firestore.FieldValue.increment(pack.amount)
                }, { merge: true });
                 console.log(`Webhook: Awarded ${pack.amount} spins to user ${userId}.`);
            }
        } else if (purchaseType === 'stickerPacks') {
             const productRef = firestore.collection('stickerPacks').doc(productId);
             const productDoc = await productRef.get();
             if (!productDoc.exists) throw new Error(`Sticker pack ${productId} not found.`);
             
             const pack = productDoc.data();
             await userRef.update({ coins: admin.firestore.FieldValue.increment(-pack.price) });
             console.log(`Webhook: User ${userId} purchased sticker pack ${productId} for ${pack.price} coins.`);
        } else {
            console.warn(`Webhook: Unhandled payload type: ${purchaseType}`);
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
