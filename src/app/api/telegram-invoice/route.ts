
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // This is a dummy endpoint for diagnostics.
    // It logs the request and returns a successful JSON response.
    console.log('[API DUMMY] Received a request. Sending back a test success response.');
    
    // The frontend expects a JSON object with 'success' and 'invoiceUrl'.
    // We provide dummy data to satisfy this expectation and prevent a client-side error.
    return NextResponse.json({ success: true, invoiceUrl: 'https://example.com/dummy-invoice-url' });

  } catch (error: any) {
    // This catch block is unlikely to be hit in this simple version, but it's here for safety.
    console.error('[API DUMMY CATCH BLOCK] An unexpected error occurred:', error);
    return NextResponse.json({ error: 'The dummy API endpoint failed unexpectedly.' }, { status: 500 });
  }
}
