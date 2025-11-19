
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PredictorPage() {
  const isVip = false; // We'll replace this with real user data

  return (
    <AppLayout title="Betting Predictor">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-headline">Game Predictor</h2>
        <p className="text-muted-foreground mt-2">
          Get AI-powered predictions for casino games. (VIP Only)
        </p>
      </div>
      
      {isVip ? (
         <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold">Predictor Content</h2>
            <p className="text-muted-foreground">VIP Content goes here.</p>
         </div>
      ) : (
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
      )}

    </AppLayout>
  );
}
