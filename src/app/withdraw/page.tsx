
'use client';

import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/components/layout/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Coins, Info, Banknote, Percent, Loader2, Send } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { doc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

const COIN_TO_USD = 0.001; // 1000 coins = $1
const MIN_WITHDRAWAL_COINS = 1500;
const SERVICE_FEE_PERCENT = 0.1; // 10%

export default function WithdrawPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const [withdrawCoins, setWithdrawCoins] = useState<string>('');
  const [paypalEmail, setPaypalEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debouncedWithdrawCoins = useDebounce(parseFloat(withdrawCoins) || 0, 300);

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
  
  useEffect(() => {
    if (userProfile && user?.email && !paypalEmail) {
      setPaypalEmail(user.email);
    }
  }, [userProfile, user, paypalEmail]);
  
  const userCoins = userProfile?.coins ?? 0;
  const userBalanceUsd = userCoins * COIN_TO_USD;

  const { usdValue, feeUsd, netUsd, error } = useMemo(() => {
    if (debouncedWithdrawCoins === 0) {
      return { usdValue: 0, feeUsd: 0, netUsd: 0, error: null };
    }
    if (debouncedWithdrawCoins < MIN_WITHDRAWAL_COINS) {
      return { usdValue: 0, feeUsd: 0, netUsd: 0, error: `Minimum withdrawal is ${MIN_WITHDRAWAL_COINS.toLocaleString()} coins.` };
    }
    if (debouncedWithdrawCoins > userCoins) {
        return { usdValue: 0, feeUsd: 0, netUsd: 0, error: 'You cannot withdraw more coins than you have.' };
    }
    const calculatedUsdValue = debouncedWithdrawCoins * COIN_TO_USD;
    const calculatedFee = calculatedUsdValue * SERVICE_FEE_PERCENT;
    const calculatedNetUsd = calculatedUsdValue - calculatedFee;
    return { usdValue: calculatedUsdValue, feeUsd: calculatedFee, netUsd: calculatedNetUsd, error: null };
  }, [debouncedWithdrawCoins, userCoins]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const canSubmit = !error && netUsd > 0 && isValidEmail(paypalEmail) && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !firestore || !user || !userProfile) return;

    setIsSubmitting(true);
    
    // This is the placeholder for the backend call.
    // In a real implementation, you would call your Next.js API route here.
    // For now, we will create a withdrawal request document directly.
    try {
        const withdrawalData = {
            userId: user.uid,
            userName: userProfile.name,
            amountCoins: debouncedWithdrawCoins,
            amountUsd: usdValue,
            feeUsd: feeUsd,
            netUsd: netUsd,
            method: 'PayPal',
            recipientAddress: paypalEmail,
            status: 'pending',
            requestedAt: serverTimestamp(),
        };
        await addDoc(collection(firestore, 'withdrawals'), withdrawalData);
      
        toast({
            title: 'Withdrawal Request Submitted',
            description: `Your request to withdraw $${netUsd.toFixed(2)} is pending review.`,
        });
        setWithdrawCoins('');
    } catch (e) {
        console.error("Withdrawal request failed:", e);
        toast({
            variant: 'destructive',
            title: 'Request Failed',
            description: 'Could not submit your withdrawal request. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <AppLayout title="Withdraw Cash">
        <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Withdraw Cash">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold">Withdraw Your Earnings</h2>
          <p className="mt-2 text-muted-foreground">
            Convert your coins into real cash.
          </p>
        </div>

        <Alert className="border-primary/30 bg-primary/10">
          <Info className="h-4 w-4" />
          <AlertTitle className="font-bold">Withdrawal Rules</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>1,000 coins = $1.00 USD</li>
              <li>Minimum withdrawal is {MIN_WITHDRAWAL_COINS.toLocaleString()} coins ($1.50).</li>
              <li>A 10% service fee applies to all cash withdrawals.</li>
              <li>Payments are processed via PayPal within 3-5 business days.</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Card>
            <CardHeader>
                <CardTitle>Create Withdrawal Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-lg bg-secondary p-4 text-center">
                    <p className="text-sm text-muted-foreground">Your Balance</p>
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-2 text-3xl font-bold text-primary">
                            <Coins className="h-7 w-7" />
                            <span>{userCoins.toLocaleString()}</span>
                        </div>
                        <div className="text-lg text-muted-foreground">
                            (${userBalanceUsd.toFixed(2)} USD)
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="coins">Coins to Withdraw</Label>
                        <Input
                            id="coins"
                            type="number"
                            placeholder="e.g., 5000"
                            value={withdrawCoins}
                            onChange={(e) => setWithdrawCoins(e.target.value)}
                            max={userCoins}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="paypal">PayPal Email</Label>
                        <Input
                            id="paypal"
                            type="email"
                            placeholder="you@example.com"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                        />
                    </div>
                </div>
                
                {withdrawCoins && (
                    <div className="space-y-3 rounded-md border p-4">
                        <h4 className="font-medium">Summary</h4>
                        {error ? (
                            <p className="text-destructive text-sm font-medium">{error}</p>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Withdrawal Value:</span>
                                    <span className="font-semibold">${usdValue.toFixed(2)}</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">Service Fee (10%):</span>
                                    <span className="font-semibold text-destructive">-${feeUsd.toFixed(2)}</span>
                                </div>
                                <hr className="border-dashed" />
                                <div className="flex justify-between text-base">
                                    <span className="font-bold">You will receive:</span>
                                    <span className="font-bold text-green-500">${netUsd.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button className="w-full" size="lg" disabled={!canSubmit} onClick={handleSubmit}>
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-5 w-5" />
                    )}
                    Request Withdrawal
                </Button>
            </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
