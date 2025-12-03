import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { admin, firestore } from '@/firebase/admin';

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

      // Example payload: "purchase-USER_ID-PRODUCT_ID-QUANTITY"
      const [type, userId, productId, quantityStr] = invoicePayload.split('-');
      const quantity = parseInt(quantityStr, 10);

      if (type !== 'purchase' || !userId || !productId || isNaN(quantity)) {
        throw new Error(`Invalid invoice payload: ${invoicePayload}`);
      }

      // Fulfill the order in Firestore
      const userRef = firestore.collection('users').doc(userId);

      // Example fulfillment logic
      if (productId === 'vip_access') {
        await userRef.update({ isVip: true });
        console.log(`VIP access granted to user ${userId}`);
      } else if (productId === '100_coins') {
        await userRef.update({
          coins: admin.firestore.FieldValue.increment(100 * quantity),
        });
        console.log(`Added ${100 * quantity} coins to user ${userId}`);
      } else if (productId === '5_spins') {
        await userRef.update({
          purchasedSpinsRemaining: admin.firestore.FieldValue.increment(5 * quantity),
        });
        console.log(`Added ${5 * quantity} spins to user ${userId}`);
      } else {
        // For physical goods, create an order document
        await firestore.collection('orders').add({
          userId,
          productId,
          quantity,
          shippingAddress: payment.order_info,
          status: 'paid',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`New physical order created for user ${userId}`);
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