
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

// This is the simplified and reliable backend route.
// It expects a complete payload from the frontend and passes it to Telegram.
export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const paymentProviderToken = process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN;

  if (!botToken || !paymentProviderToken) {
    const errorMessage = 'Telegram bot or payment provider token is not configured on the server.';
    console.error(`[TELEGRAM_INVOICE_ERROR] ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  try {
    const bot = new TelegramBot(botToken);
    const body = await request.json();

    // The frontend now sends the complete, structured payload.
    // We just need to add the provider token.
    const finalPayload: TelegramBot.CreateInvoiceLinkArgs = {
        provider_token: paymentProviderToken,
        ...body
    };

    // Basic validation to prevent crashes
    if (!finalPayload.title || !finalPayload.description || !finalPayload.payload || !finalPayload.currency || !finalPayload.prices) {
        return NextResponse.json({ error: 'Invalid request: Missing one or more required parameters (title, description, payload, currency, prices).' }, { status: 400 });
    }

    const invoiceUrl = await bot.createInvoiceLink(finalPayload);
    
    return NextResponse.json({ invoiceUrl });

  } catch (error) {
    console.error('[TELEGRAM_INVOICE_ERROR]', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred on the server.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
