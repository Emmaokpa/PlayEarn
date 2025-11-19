'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Gamepad2 } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Gamepad2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold font-headline">RewardPlay</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}
