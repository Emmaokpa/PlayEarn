
'use client';

import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Gamepad2 } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until the user's auth state is determined
    }

    if (user) {
      // If a user is logged in, redirect them to the dashboard
      router.push('/dashboard');
    } else {
      // If no user is logged in, redirect them to the login page
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // This page will only be visible for a brief moment during redirection.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Gamepad2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold font-headline">RewardPlay</h1>
        <p className="animate-pulse text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}
