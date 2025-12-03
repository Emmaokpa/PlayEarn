
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not defined.');
    return NextResponse.json({ error: 'Bot not configured.' }, { status: 500 });
  }

  try {
    const bot = new TelegramBot(botToken);
    const body = await request.json();

    // *** FIX: Construct the final payload explicitly from the body ***
    // This ensures all properties are correctly typed and present for the Telegram API.
    const finalPayload: TelegramBot.CreateInvoiceLinkArgs = {
        title: body.title,
        description: body.description,
        payload: body.payload,
        currency: body.currency,
        prices: body.prices,
        need_shipping_address: body.need_shipping_address,
    };

    // CRITICAL: Logic to handle different payment providers
    if (body.currency === 'USD') { // For physical goods via Flutterwave
      const flutterwaveToken = process.env.TELEGRAM_FLUTTERWAVE_PROVIDER_TOKEN;
      if (!flutterwaveToken) {
        throw new Error('Flutterwave provider token is not configured for physical goods.');
      }
      finalPayload.provider_token = flutterwaveToken;
    } else if (body.currency === 'XTR') { // For digital goods via Telegram Stars
      // No provider_token is needed for Stars
      delete finalPayload.provider_token;
    }

    const invoiceUrl = await bot.createInvoiceLink(finalPayload);
    
    return NextResponse.json({ invoiceUrl });

  } catch (error) {
    console.error('Failed to create invoice link:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
