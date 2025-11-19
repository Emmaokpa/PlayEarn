'use client';

import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Coins } from 'lucide-react';
import BottomNav from './bottom-nav';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';

export default function AppLayout({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const { user } = useUser();
  const { firestore } = useFirebase();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="truncate pr-4 text-xl font-bold font-headline">
          {title}
        </h1>
        <div className="flex flex-shrink-0 items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm">
            <Coins className="h-5 w-5 text-primary" />
            {isLoading ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <span className="font-bold">
                {userProfile?.coins?.toLocaleString() ?? 0}
              </span>
            )}
          </div>
          <Avatar className="h-9 w-9">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : (
              <>
                <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.name} />
                <AvatarFallback>
                  {userProfile?.name?.charAt(0) ?? 'U'}
                </AvatarFallback>
              </>
            )}
          </Avatar>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      <BottomNav />
    </div>
  );
}
