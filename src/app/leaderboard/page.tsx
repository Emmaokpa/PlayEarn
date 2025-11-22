
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { UserProfile } from '@/lib/data';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


export default function LeaderboardPage() {
  const { firestore } = useFirebase();

  const usersQuery = useMemoFirebase(
    () => (firestore 
        ? query(
            collection(firestore, 'users'), 
            orderBy('coins', 'desc'), 
            limit(100)
        ) 
        : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const getRankContent = (rank: number) => {
    if (rank === 0) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (rank === 1) return <Trophy className="h-6 w-6 text-gray-400" />;
    if (rank === 2) return <Trophy className="h-6 w-6 text-yellow-700" />;
    return <span className="font-bold">{rank + 1}</span>;
  };

  return (
    <AppLayout title="Leaderboard">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Top Earners</h2>
        <p className="mt-2 text-muted-foreground">
          The #1 VIP player wins a $10 gift card! Upgrade to compete.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top 100 players ranked by coins earned.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-2">
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <Skeleton className="h-5 w-16" />
                        </div>
                    ))}
                </div>
            ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Coins</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {users?.map((user, index) => (
                    <TableRow key={user.id} className={cn(index === 0 && 'bg-primary/10')}>
                    <TableCell className="text-center">
                        <div className="flex justify-center items-center h-full">
                           {getRankContent(index)}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-bold flex items-center gap-2">
                                {user.name}
                                {user.isVip && <Badge className="bg-primary text-primary-foreground"><Crown className="h-3 w-3 mr-1"/>VIP</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{user.coins.toLocaleString()}</TableCell>
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
