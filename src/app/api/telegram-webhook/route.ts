
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { admin, firestore } from '@/firebase/admin';

/**
 * This webhook handler has been temporarily simplified to only handle
 * the pre-checkout query required by Telegram. The payment fulfillment
 * logic has been removed and will be rebuilt.
 */
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

    // Only handle the pre-checkout query, which is required for an invoice to be shown.
    if (update.pre_checkout_query) {
      await bot.answerPreCheckoutQuery(update.pre_checkout_query.id, true);
      return NextResponse.json({ status: 'ok' });
    }

    // Acknowledge other updates (like successful payments) without processing them for now.
    if (update.message?.successful_payment) {
        console.log('Received successful payment webhook, but processing is currently disabled.');
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' });
  }
}
