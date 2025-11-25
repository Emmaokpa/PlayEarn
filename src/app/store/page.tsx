
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { InAppPurchase, StickerPack } from '@/lib/data';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PurchasePackCard from '@/components/app/purchase-pack-card';
import StickerPackCard from '@/components/app/sticker-pack-card';
import { Button } from '@/components/ui/button';
import { Coins, Star, Package, Laptop, ShoppingCart, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserProfile } from '@/lib/data';


function CurrencyStore() {
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
  )
}

function DigitalGoodsStore() {
  const { firestore, user } = useFirebase();

  const stickerPacksQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'stickerPacks') : null),
    [firestore]
  );
  const { data: stickerPacks, isLoading: stickerPacksLoading } = useCollection<StickerPack>(stickerPacksQuery);

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: userLoading } = useDoc<UserProfile>(userProfileRef);
  
  const isLoading = stickerPacksLoading || userLoading;

  return (
    <div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
           {isLoading
           ? Array.from({ length: 5 }).map((_, i) => (
               <Skeleton key={i} className="aspect-square rounded-2xl" />
               ))
           : stickerPacks?.map((pack) => (
               <StickerPackCard
                   key={pack.id}
                   pack={pack}
                   userCoins={userProfile?.coins ?? 0}
               />
               ))}
       </div>
        {(!isLoading && stickerPacks?.length === 0) && (
           <p className="text-center text-muted-foreground py-8">No sticker packs available at the moment.</p>
        )}
   </div>
  )
}

function PhysicalGoodsStore() {
    return (
        <Card className="flex flex-col items-center justify-center py-24 text-center bg-secondary/50 border-dashed">
            <CardHeader>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                    <Laptop className="h-10 w-10 text-secondary-foreground" />
                </div>
                <CardTitle className="mt-4 text-2xl">Coming Soon!</CardTitle>
                <CardDescription>
                    A marketplace for gadgets, watches, and more will be available here.<br/> Stay tuned for exciting products you can redeem with your coins.
                </CardDescription>
            </CardHeader>
        </Card>
    )
}

export default function StorePage() {
  return (
    <AppLayout title="Store">
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold">In-App Store</h2>
          <p className="mt-2 text-muted-foreground">
            Get more coins, spins, and cool digital or physical items.
          </p>
        </div>

        <Tabs defaultValue="digital" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="currency"><Coins className="mr-2 h-4 w-4" />Currency</TabsTrigger>
                <TabsTrigger value="digital"><Package className="mr-2 h-4 w-4" />Digital Goods</TabsTrigger>
                <TabsTrigger value="physical"><Laptop className="mr-2 h-4 w-4" />Physical Goods</TabsTrigger>
            </TabsList>
            <TabsContent value="currency" className="mt-6">
                <CurrencyStore />
            </TabsContent>
            <TabsContent value="digital" className="mt-6">
                <DigitalGoodsStore />
            </TabsContent>
            <TabsContent value="physical" className="mt-6">
                <PhysicalGoodsStore />
            </TabsContent>
        </Tabs>
        
      </div>
    </AppLayout>
  );
}
