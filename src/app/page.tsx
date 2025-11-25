
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function Home() {
  // In a Server Component, we can't use hooks like `useUser`.
  // A common pattern is to check for a session cookie.
  // In Firebase, the "Auth User" is managed client-side by default.
  // For a pure server-side check, you'd typically use Firebase Admin SDK
  // to verify a token passed in a cookie.

  // However, for this app's structure, the goal of this page is simply
  // to redirect to the correct starting point. The existing client-side
  // logic in `AppLayout` already handles protecting routes.
  
  // The simplest server-side fix is to redirect all root traffic to the dashboard,
  // where the existing client-side auth checks will then take over and redirect
  // to /login if necessary. This avoids the client-side redirect race condition.
  redirect('/dashboard');

  // The code below will not be reached due to the redirect.
  // This just serves as a fallback while the redirect is happening.
  return null;
}
