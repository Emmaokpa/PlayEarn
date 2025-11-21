
'use client';

import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Sparkles } from 'lucide-react';
import { useFirebase, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { predictGameOutcome } from '@/ai/flows/game-predictor-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';


function GamePredictor() {
  const [description, setDescription] = useState<string>('');
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    if (!description) {
      setError("Please describe the game or bet scenario.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const result = await predictGameOutcome({ description });
      setPrediction(result.prediction);
    } catch (e) {
      console.error(e);
      setError("There was an error getting the prediction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Casino Game & Bet Predictor</CardTitle>
        <CardDescription>Describe a casino game or a specific bet, and our AI will provide a statistical analysis. For entertainment purposes only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="bet-description">Game / Bet Scenario</Label>
            <Textarea
              id="bet-description"
              placeholder="e.g., 'Blackjack, my hand is 16, dealer is showing a 10'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
        </div>
        <Button onClick={handlePredict} className="w-full" disabled={!description || isLoading}>
            {isLoading ? "Consulting the AI..." : "Get Analysis"}
        </Button>

        {error && (
             <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {prediction && (
            <Card className="bg-secondary/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Sparkles />
                        AI Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg whitespace-pre-wrap font-mono">{prediction}</p>
                </CardContent>
            </Card>
        )}
      </CardContent>
    </Card>
  )
}


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
      return <GamePredictor />;
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
          Get AI-powered predictions for your favorite games. (VIP Only)
        </p>
      </div>
      {renderContent()}
    </AppLayout>
  );
}
