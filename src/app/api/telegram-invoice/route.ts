
import { NextResponse } from 'next/server';

/**
 * This API route has been temporarily disabled to reset the payment feature.
 * It will be rebuilt in the next step.
 */
export async function POST(request: Request) {
  console.error('[NOTICE] The telegram-invoice API is currently disabled.');
  return NextResponse.json(
    { error: 'This feature is temporarily disabled.' },
    { status: 503 }
  );
}
