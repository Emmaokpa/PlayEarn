
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { admin, firestore } from '@/firebase/admin';
import type { InAppPurchase, StickerPack } from '@/lib/data';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot;
if (botToken) {
    bot = new TelegramBot(botToken);
}

export async function POST(request: Request) {
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not configured.');
    return NextResponse.json({ status: 'error', message: 'Bot not configured' });
  }

  try {
    const update: TelegramBot.Update = await request.json();

    // 1. Handle the required Pre-Checkout Query
    if (update.pre_checkout_query) {
      // This is a mandatory step for Telegram to allow the payment to proceed.
      await bot.answerPreCheckoutQuery(update.pre_checkout_query.id, true);
      return NextResponse.json({ status: 'ok' });
    }

    // 2. Handle the Successful Payment
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const invoicePayload = payment.invoice_payload;

      // Payload format: "purchaseType-productId-userId-timestamp"
      const [purchaseType, productId, userId] = invoicePayload.split('-');

      if (!purchaseType || !productId || !userId) {
        throw new Error(`Invalid invoice payload received: ${invoicePayload}`);
      }
      
      const userRef = firestore.collection('users').doc(userId);

      // Use a transaction to ensure fulfillment is atomic
      await firestore.runTransaction(async (transaction) => {
          const productRef = firestore.collection(purchaseType).doc(productId);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists) {
            throw new Error(`Product ${productId} in collection ${purchaseType} not found.`);
          }
          
          const product = productDoc.data() as InAppPurchase | StickerPack;
          
          if (purchaseType === 'inAppPurchases') {
            const pack = product as InAppPurchase;
            if (pack.type === 'coins') {
                transaction.update(userRef, { coins: admin.firestore.FieldValue.increment(pack.amount) });
            } else if (pack.type === 'spins') {
                // For spins, we update the spinData subcollection
                const spinDataRef = firestore.doc(`users/${userId}/spinData/spin_status`);
                transaction.set(spinDataRef, { purchasedSpinsRemaining: admin.firestore.FieldValue.increment(pack.amount) }, { merge: true });
            }
          } else if (purchaseType === 'stickerPacks') {
             // Logic for sticker packs can be added here in the future
             // For now, it doesn't do anything, but the structure is ready.
          }
      });

      console.log(`Successfully fulfilled order for user ${userId}, product ${productId}`);
    }

    // Always return a 200 OK to Telegram to acknowledge receipt of the webhook
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 OK even on errors to prevent Telegram from resending indefinitely
    return NextResponse.json({ status: 'error', message: 'Internal server error' });
  }
}
