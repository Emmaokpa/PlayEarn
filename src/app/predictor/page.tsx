'use client';

import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useFirebase, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

export default function PredictorPage() {
  const { firestore, user } = useFirebase();

  const userProfileRef = useMemoFirebase(() =>
    user ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  const isVip = userProfile?.isVip ?? false;

  const renderContent = () => {
    if(isLoading) {
      return (
         <Card className="max-w-md mx-auto bg-secondary/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-40" />
                </CardTitle>
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-1" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
      )
    }

    if (isVip) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold">Predictor Content</h2>
            <p className="text-muted-foreground">VIP Content goes here.</p>
        </div>
      );
    }

    return (
       <Card className="max-w-md mx-auto bg-secondary/30">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Unlock VIP Access
              </CardTitle>
              <CardDescription>
                  This feature is exclusive to our VIP members. Upgrade now to get access to the game predictor and other amazing benefits.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Button className="w-full" size="lg">Upgrade to VIP</Button>
          </CardContent>
      </Card>
    );
  }

  return (
    <AppLayout title="Betting Predictor">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-headline">Game Predictor</h2>
        <p className="text-muted-foreground mt-2">
          Get AI-powered predictions for casino games. (VIP Only)
        </p>
      </div>
      {renderContent()}
    </AppLayout>
  );
}
