'use client';

import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { useState } from 'react';
import WatchAdDialog from '@/components/app/watch-ad-dialog';

export default function EarnPage() {
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);

  return (
    <AppLayout title="Earn Rewards">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold font-headline">More Ways to Earn</h2>
          <p className="text-muted-foreground mt-2">
            Complete tasks to collect more reward points.
          </p>
        </div>
        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Trophy className="h-8 w-8 text-accent" />
              Watch & Earn
            </CardTitle>
            <CardDescription className="pt-2">
              Watch a short video ad and get rewarded with 10 points instantly!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setIsAdDialogOpen(true)}
            >
              Watch Video Ad
            </Button>
          </CardContent>
        </Card>
      </div>
      <WatchAdDialog open={isAdDialogOpen} onOpenChange={setIsAdDialogOpen} />
    </AppLayout>
  );
}
