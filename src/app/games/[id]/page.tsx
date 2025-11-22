
'use client';

import { notFound } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import type { Game } from '@/lib/data';
import { getGameById } from '@/lib/games';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export default function GamePage({ params }: { params: { id: string } }) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = params;

  useEffect(() => {
    const foundGame = getGameById(id);
    setGame(foundGame);
    setIsLoading(false);
  }, [id]);


  const handleSaveProgress = async () => {
    if (!firestore || !user || !game) return;
    const gameProgressRef = doc(firestore, `users/${user.uid}/gameProgress`, game.id);
    
    // In a real game, you'd get the progress from the iframe via postMessage
    const progressData = { 
        id: game.id,
        userId: user.uid,
        gameId: game.id,
        progressData: JSON.stringify({ score: Math.floor(Math.random() * 10000) }),
        lastUpdated: new Date().toISOString() 
    };

    try {
        // Use setDoc with merge:true to create or update the document
        await setDoc(gameProgressRef, progressData, { merge: true });
        toast({
            title: "Progress Saved!",
            description: `Your progress for ${game.name} has been saved.`,
        });
    } catch(e) {
        console.error("Error saving progress", e);
        toast({
            title: "Error",
            description: "Could not save your progress.",
            variant: "destructive",
        });
    }
  };


  if (isLoading) {
    return (
      <AppLayout title="Loading Game...">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!game) {
    notFound();
  }

  return (
    <AppLayout title={game.name}>
      <div className="space-y-4">
        <Card className="aspect-[16/9] w-full overflow-hidden bg-black">
          <iframe
            src={game.iframeUrl}
            title={game.name}
            className="h-full w-full border-0"
            allow="fullscreen; gamepad; autoplay;"
            sandbox="allow-scripts allow-same-origin"
          />
        </Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Now playing: {game.name}
          </p>
          <Button onClick={handleSaveProgress}>
            <Save className="mr-2 h-4 w-4" />
            Save Progress
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
