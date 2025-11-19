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
import { Trophy, Users, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import WatchAdDialog from '@/components/app/watch-ad-dialog';
import { useToast } from '@/hooks/use-toast';
import { mockUser } from '@/lib/data';

export default function EarnPage() {
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(mockUser.referralCode);
    setCopied(true);
    toast({
      title: 'Copied to clipboard!',
      description: 'Share your code with friends to earn rewards.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout title="Earn Rewards">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold font-headline">
            More Ways to Earn
          </h2>
          <p className="text-muted-foreground mt-2">
            Complete tasks to collect more reward points.
          </p>
        </div>

        <div className="max-w-lg mx-auto space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Trophy className="h-8 w-8 text-accent" />
                Watch & Earn
              </CardTitle>
              <CardDescription className="pt-2">
                Watch a short video ad and get rewarded with 10 points
                instantly!
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

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="h-8 w-8 text-accent" />
                Refer a Friend
              </CardTitle>
              <CardDescription className="pt-2">
                Invite a friend with your code and you both get{' '}
                <span className="font-bold text-primary">1,000 coins</span>!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Your referral code:</p>
              <div className="flex gap-2">
                <div className="flex-grow select-all rounded-md border border-dashed border-border bg-secondary/50 px-4 py-2 text-center font-mono text-lg tracking-widest text-secondary-foreground">
                  {mockUser.referralCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                  aria-label="Copy referral code"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <WatchAdDialog open={isAdDialogOpen} onOpenChange={setIsAdDialogOpen} />
    </AppLayout>
  );
}
