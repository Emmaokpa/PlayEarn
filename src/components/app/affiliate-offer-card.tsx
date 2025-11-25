
'use client';

import { useState } from 'react';
import type { AffiliateOffer, UserProfile } from '@/lib/data';
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
import { useToast } from '@/hooks/use-toast';
import { Coins, CheckCircle, ExternalLink, Send, Hourglass, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, collection } from 'firebase/firestore';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import ImageUpload from './ImageUpload';
import { Label } from '@/components/ui/label';
import { CldUploadWidget } from 'next-cloudinary';


interface AffiliateOfferCardProps {
  offer: AffiliateOffer;
  userProfile: UserProfile | null;
  completedOffers: string[];
  pendingOffers: string[];
}

export default function AffiliateOfferCard({
  offer,
  userProfile,
  completedOffers,
  pendingOffers
}: AffiliateOfferCardProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [proofText, setProofText] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  const isCompleted = completedOffers.includes(offer.id);
  const isPending = pendingOffers.includes(offer.id);

  const handleSubmitForReview = async () => {
    if (!user || !firestore || !userProfile || (!proofText && !proofImageUrl)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please provide text or image proof of completion.' });
        return;
    }
    
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

        // Also track that this user has submitted this offer
        const userSubmissionRef = doc(firestore, `users/${user.uid}/affiliateSignups`, offer.id);
        await setDoc(userSubmissionRef, { status: 'pending' }, { merge: true });


        toast({
            title: 'Submission Received!',
            description: 'Your submission is now pending review by an admin. You will receive your coins upon approval.',
        });
        setProofText('');
        setProofImageUrl('');

    } catch (error) {
       console.error("Error submitting for review:", error);
       toast({
           variant: 'destructive',
           title: 'Submission Error',
           description: 'There was an issue submitting your proof. Please try again.',
       })
    }
  };

  const getButtonState = () => {
    if (isCompleted) {
        return (
            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" disabled>
                <CheckCircle className="mr-2 h-5 w-5" />
                Completed
            </Button>
        );
    }
    if (isPending) {
        return (
            <Button size="lg" className="w-full" disabled>
                <Hourglass className="mr-2 h-5 w-5 animate-spin" />
                Pending Review
            </Button>
        );
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="lg" className="w-full">
                    <Send className="mr-2 h-5 w-5" />
                    Submit for Review
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Submit Proof for "{offer.title}"</AlertDialogTitle>
                    <AlertDialogDescription>
                        After completing the offer, provide proof of completion (e.g. username, email, screenshot). An admin will review it.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="proofText">Text Proof (Username, Email, etc.)</Label>
                        <Input 
                            id="proofText"
                            value={proofText} 
                            onChange={(e) => setProofText(e.target.value)}
                            placeholder="e.g., your_username"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>Image Proof (Screenshot)</Label>
                        <CldUploadWidget
                            options={{ cloudName }}
                            uploadPreset="qa4yjgs4"
                            onSuccess={(result: any) => {
                                if (result.event === 'success') {
                                    setProofImageUrl(result.info.secure_url);
                                }
                            }}
                        >
                        {({ open }) => {
                            return (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => open()}
                                    disabled={!cloudName}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Image
                                </Button>
                            );
                        }}
                        </CldUploadWidget>
                        {proofImageUrl && (
                           <div className="mt-4">
                                <p className="text-sm text-muted-foreground mb-2">Image Preview:</p>
                                <Image
                                    src={proofImageUrl}
                                    alt="Uploaded image preview"
                                    width={200}
                                    height={150}
                                    className="rounded-md border object-cover"
                                />
                           </div>
                        )}
                     </div>
                     <Link href={offer.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                        Go to Offer Page <ExternalLink className="h-4 w-4" />
                    </Link>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmitForReview} disabled={!proofText && !proofImageUrl}>
                        Submit
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
  }

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden transition-shadow hover:shadow-lg',
        (isCompleted || isPending) && 'opacity-70'
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
