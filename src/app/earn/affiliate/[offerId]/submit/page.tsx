
'use client';

import { use, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import type { AffiliateOffer, UserProfile } from '@/lib/data';
import { useAffiliateOfferById } from '@/lib/offers';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ImageUpload from '@/components/app/ImageUpload';
import { ExternalLink, Send } from 'lucide-react';
import Link from 'next/link';

export default function SubmitAffiliatePage({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = use(params);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [proofText, setProofText] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: offer, isLoading: offerLoading } = useAffiliateOfferById(offerId);

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = offerLoading || profileLoading;

  const handleSubmit = async () => {
    if (!user || !firestore || !userProfile || !offer || (!proofText && !proofImageUrl)) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide text or image proof of completion.',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submissionRef = doc(collection(firestore, 'affiliateSubmissions'));
      await setDoc(submissionRef, {
        id: submissionRef.id,
        userId: user.uid,
        userName: userProfile.name,
        offerId: offer.id,
        offerTitle: offer.title,
        proofText: proofText,
        proofImageUrl: proofImageUrl,
        status: 'pending',
        submittedAt: serverTimestamp(),
        rewardAmount: offer.rewardCoins,
      });

      const userSubmissionRef = doc(firestore, `users/${user.uid}/affiliateSignups`, offer.id);
      await setDoc(userSubmissionRef, { status: 'pending' }, { merge: true });

      toast({
        title: 'Submission Received!',
        description: 'Your proof is pending review. You will receive coins upon approval.',
      });
      
      router.push('/earn/affiliate');

    } catch (error) {
      console.error('Error submitting for review:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: 'There was an issue submitting your proof. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Submit Proof">
        <Skeleton className="h-96 w-full" />
      </AppLayout>
    );
  }

  if (!offer) {
    notFound();
  }

  return (
    <AppLayout title="Submit Proof">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Submit Proof for "{offer.title}"</CardTitle>
          <CardDescription>
            After completing the offer, provide proof of completion (e.g. username, email, or a screenshot). An admin will review it and award your coins.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-6 min-h-0">
          <div className="space-y-2">
            <Label htmlFor="proofText">Text Proof (Username, Email, etc.)</Label>
            <Input
              id="proofText"
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="e.g., your_username_123"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Image Proof (Screenshot)</Label>
            <ImageUpload 
              onUpload={setProofImageUrl} 
              initialImageUrl={proofImageUrl} 
            />
          </div>
        </CardContent>
         <CardFooter className="flex flex-col items-stretch gap-4 pt-6">
           <Button onClick={handleSubmit} disabled={isSubmitting || (!proofText && !proofImageUrl)} className="w-full" size="lg">
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
           </Button>
           <Button asChild variant="outline" className="w-full">
              <Link href={offer.link} target="_blank" rel="noopener noreferrer">
                  Go back to Offer Page
                  <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
           </Button>
        </CardFooter>
      </Card>
    </AppLayout>
  );
}
