
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { InAppPurchase } from '@/lib/data';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PurchasePackCard from '@/components/app/purchase-pack-card';
import { Button } from '@/components/ui/button';
import { Coins, Star, Laptop, Package, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function Section({ title, description, icon: Icon, children, className }: { title: string, description: string, icon: React.ElementType, children: React.ReactNode, className?: string }) {
    return (
        <div className={className}>
            <div className="mb-6 text-center">
                <Icon className="mx-auto h-10 w-10 text-primary mb-2" />
                <h3 className="text-2xl font-bold font-headline">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
        </div>
    )
}

function StoreCategoryCard({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: React.ElementType; }) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-lg">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">
              {description}
            </CardDescription>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </CardHeader>
      </Card>
    </Link>
  );
}


export default function StorePage() {
  const { firestore } = useFirebase();

  const packsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'inAppPurchases') : null),
    [firestore]
  );
  const { data: allPacks, isLoading: packsLoading } = useCollection<InAppPurchase>(packsQuery);

  const coinPacks = allPacks?.filter(p => p.type === 'coins').sort((a,b) => a.price - b.price) ?? [];
  const spinPacks = allPacks?.filter(p => p.type === 'spins').sort((a,b) => a.price - b.price) ?? [];
  
  const isLoading = packsLoading;

  return (
    <AppLayout title="Store">
      <div className="space-y-12">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold">In-App Store</h2>
          <p className="mt-2 text-muted-foreground">
            Get more coins, spins, and cool digital or physical items.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StoreCategoryCard 
                href="/store/digital"
                title="Digital Goods"
                description="Stickers and other virtual items."
                icon={Package}
            />
            <StoreCategoryCard 
                href="/store/physical"
                title="Physical Goods"
                description="Gadgets, watches, and more."
                icon={Laptop}
            />
        </div>
        
        <Section title="In-App Currency" description="Boost your balance to keep the fun going." icon={Coins}>
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {isLoading ? (
                    <>
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </>
                ) : (
                    <>
                        {coinPacks.map((pack) => <PurchasePackCard key={pack.id} pack={pack} />)}
                        {spinPacks.map((pack) => <PurchasePackCard key={pack.id} pack={pack} />)}
                    </>
                )}
            </div>
        </Section>
        
      </div>
    </AppLayout>
  );
}
