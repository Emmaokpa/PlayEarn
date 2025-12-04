
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { admin, firestore } from '@/firebase/admin';
import type { InAppPurchase, StickerPack } from '@/lib/data';

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not configured.');
    return NextResponse.json({ status: 'error', message: 'Bot not configured' });
  }
  
  // CORRECT INITIALIZATION: Initialize the bot inside the handler.
  const bot = new TelegramBot(botToken);

  try {
    const update: TelegramBot.Update = await request.json();

    // 1. Handle the required Pre-Checkout Query
    if (update.pre_checkout_query) {
      await bot.answerPreCheckoutQuery(update.pre_checkout_query.id, true);
      return NextResponse.json({ status: 'ok' });
    }

    // 2. Handle the Successful Payment notification
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const invoicePayload = payment.invoice_payload;

      const [purchaseType, productId, userId] = invoicePayload.split('-');

      if (!purchaseType || !productId || !userId) {
        throw new Error(`Invalid invoice payload received: ${invoicePayload}`);
      }
      
      const userRef = firestore.collection('users').doc(userId);

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
                const spinDataRef = firestore.doc(`users/${userId}/spinData/spin_status`);
                transaction.set(spinDataRef, { purchasedSpinsRemaining: admin.firestore.FieldValue.increment(pack.amount) }, { merge: true });
            }
          } else if (purchaseType === 'stickerPacks') {
             const userStickerRef = firestore.doc(`users/${userId}/ownedStickerPacks/${product.id}`);
             transaction.set(userStickerRef, {
                packId: product.id,
                packName: product.name,
                acquiredAt: admin.firestore.FieldValue.serverTimestamp(),
             });
          }
      });

      console.log(`Successfully fulfilled order for user ${userId}, product ${productId}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' });
  }
}
