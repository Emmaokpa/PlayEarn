
'use client';

/**
 * Initiates a Telegram payment by creating an invoice and opening it.
 *
 * @param payload The data required by the backend to create an invoice. It should
 * at least contain `productId` and `purchaseType`.
 * @returns A promise that resolves with a success status or rejects with an error.
 */
export async function initiateTelegramPayment(
  payload: Record<string, any>,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/telegram-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId, // Pass user ID in a header for backend access
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create invoice.');
    }

    const { invoiceUrl } = result;

    if (invoiceUrl && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openInvoice(invoiceUrl, (status) => {
        if (status === 'paid') {
          console.log('Invoice paid!');
          // The webhook on the backend will handle fulfillment.
          // Optional: You can show an immediate UI update here.
        } else if (status === 'cancelled') {
          console.log('Invoice cancelled.');
        } else if (status === 'failed') {
          console.error('Invoice payment failed.');
        }
      });
      return { success: true };
    } else {
      // This error occurs if not running inside Telegram or if Telegram's script hasn't loaded
      throw new Error('Could not open the invoice. Please ensure you are in the Telegram app.');
    }
  } catch (error) {
    console.error('Telegram Payment Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: message };
  }
}
