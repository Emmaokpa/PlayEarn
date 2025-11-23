
'use client';

import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Coins } from 'lucide-react';
import BottomNav from './bottom-nav';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';


export default function AppLayout({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  const isGamePage = pathname.includes('/games/');

  useEffect(() => {
    // If auth state is resolved and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const isLoading = isUserLoading || isProfileLoading;

  // Render a loading state or nothing while auth is being checked or redirecting
  if (isLoading || !user) {
     return (
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm sm:px-6">
          <Skeleton className="h-7 w-32" />
          <div className="flex flex-shrink-0 items-center gap-4">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* You could put a larger skeleton layout here for the main content */}
        </main>
        <div className="sticky bottom-0 z-10 mt-auto border-t border-border bg-background/90 backdrop-blur-sm">
           <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-stretch gap-2 px-4">
              <Skeleton className="h-full w-full" />
              <Skeleton className="h-full w-full" />
              <Skeleton className="h-full w-full" />
              <Skeleton className="h-full w-full" />
              <Skeleton className="h-full w-full" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-screen w-full flex-col bg-background text-foreground", isGamePage && "landscape:overflow-hidden")}>
      <header className={cn("sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm sm:px-6", isGamePage && "landscape:hidden")}>
        <h1 className="truncate pr-4 text-xl font-bold font-headline">
          {title}
        </h1>
        <div className="flex flex-shrink-0 items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-bold">
              {userProfile?.coins?.toLocaleString() ?? 0}
            </span>
          </div>
          <Avatar className="h-9 w-9">
            <>
              <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.name} />
              <AvatarFallback>
                {userProfile?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </>
          </Avatar>
        </div>
      </header>
      <main className={cn("flex-1 overflow-y-auto p-4 sm:p-6", isGamePage && "flex flex-col")}>{children}</main>
      <div className={cn(isGamePage && "landscape:hidden")}>
         <BottomNav />
      </div>
    </div>
  );
}
