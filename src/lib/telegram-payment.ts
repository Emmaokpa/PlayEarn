
'use client';

/**
 * This payment initiation library has been temporarily disabled.
 * It will be rebuilt correctly in the next step.
 */
export async function initiateTelegramPayment(
  payload: Record<string, any>,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  console.error('[NOTICE] The payment initiation logic is currently disabled.');
  return {
    success: false,
    error: 'The payment feature is temporarily unavailable.',
  };
}
