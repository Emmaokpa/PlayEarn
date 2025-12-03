
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

    // Explicitly validate all required fields to prevent crashes and provide clear errors.
    const requiredFields = ['title', 'description', 'payload', 'currency', 'prices'];
    for (const field of requiredFields) {
        if (!body[field]) {
            const errorMessage = `Invalid request: Missing required parameter "${field}".`;
            console.error(`[TELEGRAM_INVOICE_ERROR] ${errorMessage}`);
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }
    }

    // Manually construct the payload for Telegram to ensure type safety and correctness.
    const finalPayload: TelegramBot.CreateInvoiceLinkArgs = {
        title: body.title,
        description: body.description,
        payload: body.payload,
        currency: body.currency,
        prices: body.prices,
        photo_url: body.photo_url,
        photo_width: body.photo_width,
        photo_height: body.photo_height,
        need_name: body.need_name,
        need_phone_number: body.need_phone_number,
        need_email: body.need_email,
        need_shipping_address: body.need_shipping_address,
        is_flexible: body.is_flexible,
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
