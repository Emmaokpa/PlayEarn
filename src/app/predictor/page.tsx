
'use client';

import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Sparkles } from 'lucide-react';
import { useFirebase, useDoc, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { UserProfile, Game } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from 'react';
import { predictGameOutcome } from '@/ai/flows/game-predictor-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


function GamePredictor() {
  const { firestore } = useFirebase();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const gamesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'games') : null),
    [firestore]
  );
  const { data: games, isLoading: gamesLoading } = useCollection<Game>(gamesQuery);

  const handlePredict = async () => {
    if (!selectedGame) {
      setError("Please select a game first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const result = await predictGameOutcome({ gameName: selectedGame });
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
        <CardTitle>Get Your Prediction</CardTitle>
        <CardDescription>Select a game and our AI will provide an insight or prediction. For entertainment purposes only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Select onValueChange={setSelectedGame} disabled={gamesLoading || isLoading}>
            <SelectTrigger>
                <SelectValue placeholder="Select a game..." />
            </SelectTrigger>
            <SelectContent>
                {games?.map((game) => (
                <SelectItem key={game.id} value={game.name}>
                    {game.name}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
        <Button onClick={handlePredict} className="w-full" disabled={!selectedGame || isLoading}>
            {isLoading ? "Consulting the AI..." : "Get Prediction"}
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
                        AI Prediction for {selectedGame}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg whitespace-pre-wrap">{prediction}</p>
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
