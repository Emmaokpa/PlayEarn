
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { SpinHistory, SpinPrize } from '@/lib/data';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Coins, Gift, Star, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


function PrizeDisplay({ prize }: { prize: SpinPrize }) {
    let icon, text;

    switch(prize.type) {
      case 'coins':
        icon = <Coins className="h-5 w-5 text-primary" />;
        text = `${(prize.value as number).toLocaleString()} Coins`;
        break;
      case 'sticker':
        icon = <Star className="h-5 w-5 text-accent" />;
        text = `${prize.value} Sticker`;
        break;
      case 'entry':
        icon = <Ticket className="h-5 w-5 text-green-500" />;
        text = `$${prize.value} Gift Card Entry`;
        break;
      case 'gift_card':
         icon = <Gift className="h-5 w-5 text-yellow-400" />;
         text = prize.text === 'JACKPOT' ? 'JACKPOT!' : `$${prize.value} Gift Card`;
         break;
       default:
        return null;
    }
  
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-semibold">{text}</span>
    </div>
  );
}


export default function SpinHistoryPage() {
  const { firestore, user } = useFirebase();

  const historyQuery = useMemoFirebase(
    () => (firestore && user
        ? query(
            collection(firestore, `users/${user.uid}/spinHistory`), 
            orderBy('timestamp', 'desc'), 
            limit(50)
        ) 
        : null),
    [firestore, user]
  );
  const { data: history, isLoading } = useCollection<SpinHistory>(historyQuery);

  return (
    <AppLayout title="Spin History">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Your Spin History</h2>
        <p className="mt-2 text-muted-foreground">
          A record of your last 50 spins.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Spins</CardTitle>
          <CardDescription>Here's what you've won recently.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-2">
                            <Skeleton className="h-6 w-32" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-5 w-20" />
                        </div>
                    ))}
                </div>
            ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Prize Won</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {history?.map((spin) => (
                    <TableRow key={spin.id}>
                        <TableCell>
                            <PrizeDisplay prize={spin.prizeWon} />
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="capitalize">{spin.spinType}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                            {formatDistanceToNow(spin.timestamp.toDate(), { addSuffix: true })}
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
