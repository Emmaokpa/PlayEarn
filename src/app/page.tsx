'use client';

import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Gamepad2 } from 'lucide-react';

declare global {
  interface Window {
    Telegram: any;
  }
}

export default function Home() {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Wait for client-side hydration and for user status to be determined.
    if (!isClient || isUserLoading) {
      return;
    }

    // A simple check to see if we are inside Telegram
    const isTelegram = window.Telegram && window.Telegram.WebApp;

    if (isTelegram) {
      if (user) {
        // If we have a user, go to the dashboard
        router.push('/dashboard');
      }
      // If no user, the client provider is likely still trying to authenticate.
      // We'll let it handle the logic and stay on this loading page.
    } else {
        // If not in Telegram, we could show an error or a different UI.
        // For now, we'll also just wait.
    }

  }, [user, isUserLoading, router, isClient]);
  

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Gamepad2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold font-headline">RewardPlay</h1>
        <p className="text-muted-foreground">Connecting to Telegram...</p>
      </div>
    </main>
  );
}
