
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

// This is the simplified and reliable backend route.
// It expects a complete payload from the frontend and passes it to Telegram.
export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    const errorMessage = 'Telegram bot token is not configured on the server.';
    console.error(`[TELEGRAM_INVOICE_ERROR] ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  try {
    const bot = new TelegramBot(botToken);
    const body = await request.json();

    // Basic validation to prevent crashes
    if (!body.title || !body.description || !body.payload || !body.currency || !body.prices) {
        return NextResponse.json({ error: 'Invalid request: Missing one or more required parameters (title, description, payload, currency, prices).' }, { status: 400 });
    }

    const finalPayload: TelegramBot.CreateInvoiceLinkArgs = {
        ...body
    };
    
    // The payment_provider_token is ONLY required for non-Stars currencies.
    if (body.currency !== 'XTR') {
        const paymentProviderToken = process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN;
        if (!paymentProviderToken) {
            const errorMessage = `Payment provider token is required for ${body.currency} currency but is not configured on the server.`;
            console.error(`[TELEGRAM_INVOICE_ERROR] ${errorMessage}`);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }
        finalPayload.provider_token = paymentProviderToken;
    }

    const invoiceUrl = await bot.createInvoiceLink(finalPayload);
    
    return NextResponse.json({ invoiceUrl });

  } catch (error) {
    console.error('[TELEGRAM_INVOICE_ERROR]', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred on the server.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
