
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { UserPrize, SpinPrize } from '@/lib/data';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, limit, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Gift, Star, Ticket, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


function PrizeIcon({ prize, className }: { prize: SpinPrize, className?: string }) {
    switch(prize.type) {
      case 'sticker':
        return <Star className={cn("h-8 w-8 text-accent", className)} />;
      case 'entry':
        return <Ticket className={cn("h-8 w-8 text-green-500", className)} />;
      case 'gift_card':
         return <Gift className={cn("h-8 w-8 text-yellow-400", className)} />;
      default:
        return <Package className={cn("h-8 w-8 text-muted-foreground", className)} />;
    }
}

function PrizeCard({ userPrize }: { userPrize: UserPrize }) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    
    const getFormattedDate = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true });
    }

    const prizeText = userPrize.prize.text === 'JACKPOT' 
        ? 'JACKPOT! $25 Gift Card' 
        : userPrize.prize.type === 'gift_card' 
        ? `$${userPrize.prize.value} Gift Card`
        : userPrize.prize.type === 'sticker'
        ? `${userPrize.prize.value} Sticker`
        : userPrize.prize.type === 'entry'
        ? `$${userPrize.prize.value} Draw Entry`
        : 'Prize';
    
    const handleClaim = async () => {
        if (!firestore || !user || userPrize.status === 'claimed') return;

        const prizeRef = doc(firestore, `users/${user.uid}/prizes`, userPrize.id);
        try {
            await updateDoc(prizeRef, { status: 'claimed' });
            toast({
                title: 'Prize Claimed!',
                description: `Your "${prizeText}" has been marked as claimed. We will process it shortly.`,
            });
        } catch (error) {
            console.error("Error claiming prize: ", error);
            toast({ variant: 'destructive', title: 'Claim Failed', description: 'Could not claim your prize. Please try again.'});
        }
    }
    
    return (
        <Card className={cn("flex flex-col", userPrize.status === 'claimed' && 'opacity-60')}>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <PrizeIcon prize={userPrize.prize} />
                    <CardTitle>{prizeText}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <CardDescription>
                   Won {getFormattedDate(userPrize.wonAt)} from the Spin Wheel.
                </CardDescription>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 <Badge variant={userPrize.status === 'claimed' ? 'secondary' : 'default'} className="capitalize">
                    {userPrize.status}
                </Badge>
                <Button onClick={handleClaim} disabled={userPrize.status === 'claimed'}>
                    {userPrize.status === 'claimed' ? 'Claimed' : 'Claim Now'}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function PrizesPage() {
  const { firestore, user } = useFirebase();

  const prizesQuery = useMemoFirebase(
    () => (firestore && user
        ? query(
            collection(firestore, `users/${user.uid}/prizes`), 
            orderBy('wonAt', 'desc'), 
            limit(100)
        ) 
        : null),
    [firestore, user]
  );
  const { data: prizes, isLoading } = useCollection<UserPrize>(prizesQuery);

  return (
    <AppLayout title="My Prizes">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">My Prize Collection</h2>
        <p className="mt-2 text-muted-foreground">
          All the special items you've won are stored here.
        </p>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : prizes && prizes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {prizes.map((prize) => <PrizeCard key={prize.id} userPrize={prize} />)}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                    <Package className="h-8 w-8 text-secondary-foreground" />
                </div>
                <CardTitle className="mt-4">Your collection is empty</CardTitle>
                <CardDescription>
                    Win stickers, gift cards, and more from the Spin Wheel to start your collection!
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/spin">
                        <Star className="mr-2 h-4 w-4" />
                        Go to Spin Wheel
                    </Link>
                </Button>
            </CardContent>
        </Card>
      )}

    </AppLayout>
  );
}
