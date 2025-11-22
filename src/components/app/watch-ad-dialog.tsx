
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Film, CheckCircle } from 'lucide-react';

export default function WatchAdDialog({
  open,
  onOpenChange,
  onAdComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdComplete: () => void;
}) {
  const [countdown, setCountdown] = useState(15);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (open) {
      setIsComplete(false);
      setCountdown(15);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [open]);

  const handleClaim = () => {
    onAdComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Watching Ad</DialogTitle>
          <DialogDescription>
            Please watch the ad to claim your reward.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex flex-col items-center justify-center space-y-4 rounded-lg bg-secondary p-8 text-secondary-foreground">
          {isComplete ? (
            <CheckCircle className="h-16 w-16 animate-in fade-in zoom-in text-accent" />
          ) : (
            <Film className="h-16 w-16 animate-pulse" />
          )}
          <p className="text-lg font-semibold">
            {isComplete ? 'Ad Finished!' : `Reward in ${countdown}s`}
          </p>
          <Progress
            value={((15 - countdown) / 15) * 100}
            className="h-2 w-full"
          />
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={handleClaim}
            disabled={!isComplete}
            variant={isComplete ? 'default' : 'secondary'}
          >
            {isComplete ? 'Claim Your Spin!' : 'Claiming...'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    