
'use client';

import type TelegramBot from 'node-telegram-bot-api';

/**
 * Initiates a Telegram payment by creating an invoice and opening it.
 *
 * @param payload The invoice details, excluding the provider token which will be added on the backend.
 * @returns A promise that resolves with a success status or rejects with an error.
 */
export async function initiateTelegramPayment(
  payload: Omit<TelegramBot.CreateInvoiceLinkArgs, 'provider_token'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/telegram-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create invoice.');
    }

    const { invoiceUrl } = result;

    if (invoiceUrl && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openInvoice(invoiceUrl);
      return { success: true };
    } else {
      throw new Error('Could not open the invoice.');
    }
  } catch (error) {
    console.error('Telegram Payment Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: message };
  }
}
