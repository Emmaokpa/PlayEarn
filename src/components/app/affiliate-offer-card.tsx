
'use client';

import type { AffiliateOffer, UserAffiliate } from '@/lib/data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Coins, CheckCircle, Hourglass, Send, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';


interface AffiliateOfferCardProps {
  offer: AffiliateOffer;
  userSubmission: UserAffiliate | undefined;
}

export default function AffiliateOfferCard({
  offer,
  userSubmission,
}: AffiliateOfferCardProps) {
  
  const status = userSubmission?.status;

  const getButtonState = () => {
    if (status === 'approved') {
        return (
            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" disabled>
                <CheckCircle className="mr-2 h-5 w-5" />
                Completed
            </Button>
        );
    }
    if (status === 'pending') {
        return (
            <Button size="lg" className="w-full" disabled>
                <Hourglass className="mr-2 h-5 w-5 animate-spin" />
                Pending Review
            </Button>
        );
    }

    // New button group for a clearer flow
    return (
        <div className="w-full space-y-2">
             <Button asChild size="lg" className="w-full">
                <Link href={offer.link} target="_blank" rel="noopener noreferrer">
                    Go to Offer
                    <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full">
                <Link href={`/earn/affiliate/${offer.id}/submit`}>
                    <Send className="mr-2 h-5 w-5" />
                    Submit Proof
                </Link>
            </Button>
        </div>
    )
  }

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden transition-shadow hover:shadow-lg',
        status === 'approved' && 'opacity-70'
      )}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={offer.imageUrl}
            alt={offer.title}
            fill
            className="rounded-t-lg object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            data-ai-hint={offer.imageHint}
            referrerPolicy="no-referrer"
            unoptimized
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <CardTitle>{offer.title}</CardTitle>
        <CardDescription className="mt-2 text-sm">{offer.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 rounded-b-lg bg-secondary/50 p-4">
        <div className="flex w-full items-center justify-between">
           <p className="text-sm font-semibold text-muted-foreground">REWARD</p>
            <div className="flex items-center gap-2 text-xl font-bold text-primary">
                <Coins className="h-6 w-6" />
                <span>{offer.rewardCoins.toLocaleString()}</span>
            </div>
        </div>
        {getButtonState()}
      </CardFooter>
    </Card>
  );
}
