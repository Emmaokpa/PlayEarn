
'use client';

import { useState, useMemo } from 'react';
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
import { Coins, Info, Banknote, Loader2, Send, CreditCard, Landmark } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { doc, serverTimestamp, addDoc, collection, writeBatch, increment } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COIN_TO_USD = 0.001; // 1000 coins = $1
const MIN_WITHDRAWAL_COINS = 1500;
const SERVICE_FEE_PERCENT = 0.1; // 10%

type WithdrawalMethod = 'bank_transfer' | 'gift_card' | 'paypal';

export default function WithdrawPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const [withdrawCoins, setWithdrawCoins] = useState<string>('');
  const [method, setMethod] = useState<WithdrawalMethod>('bank_transfer');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debouncedWithdrawCoins = useDebounce(parseFloat(withdrawCoins) || 0, 300);

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

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

  const canSubmit = useMemo(() => {
    if (error || netUsd <= 0 || isSubmitting) return false;
    if (method === 'bank_transfer') {
        return bankName.trim().length > 2 && /^\d{10}$/.test(accountNumber);
    }
    if (method === 'paypal') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail);
    }
    if (method === 'gift_card') {
        return true;
    }
    return false;
  }, [error, netUsd, isSubmitting, method, bankName, accountNumber, paypalEmail]);

  const handleSubmit = async () => {
    if (!canSubmit || !firestore || !user || !userProfile) return;

    setIsSubmitting(true);
    
    // Create a transaction to ensure atomicity
    const batch = writeBatch(firestore);

    // 1. Deduct coins from user's profile
    const userRef = doc(firestore, 'users', user.uid);
    batch.update(userRef, { coins: increment(-debouncedWithdrawCoins) });
    
    // 2. Create the withdrawal request record
    let recipientDetails = {};
    if (method === 'bank_transfer') {
        recipientDetails = {
            method: 'Nigerian Bank Transfer',
            recipientAddress: `${bankName} - ${accountNumber}`,
            bankName: bankName,
            accountNumber: accountNumber,
        };
    } else if (method === 'paypal') {
        recipientDetails = {
            method: 'PayPal',
            recipientAddress: paypalEmail,
            bankName: null,
            accountNumber: null,
        };
    } else { // gift_card
         recipientDetails = {
            method: 'Gift Card',
            recipientAddress: user.email, // Send gift card codes to user's email
            bankName: null,
            accountNumber: null,
        };
    }

    const withdrawalData = {
        userId: user.uid,
        userName: userProfile.name,
        amountCoins: debouncedWithdrawCoins,
        amountUsd: usdValue,
        feeUsd: feeUsd,
        netUsd: netUsd,
        status: 'pending',
        requestedAt: serverTimestamp(),
        ...recipientDetails,
    };
    
    const withdrawalRef = doc(collection(firestore, 'withdrawals'));
    batch.set(withdrawalRef, withdrawalData);

    try {
        await batch.commit();
        toast({
            title: 'Withdrawal Request Submitted',
            description: `Your request to withdraw $${netUsd.toFixed(2)} is pending review.`,
        });
        setWithdrawCoins('');
        setBankName('');
        setAccountNumber('');
        setPaypalEmail('');
    } catch (e) {
        console.error("Withdrawal request failed:", e);
        toast({
            variant: 'destructive',
            title: 'Request Failed',
            description: 'Could not submit your withdrawal request. Please contact support if coins were deducted.',
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
              <li>Payments are processed within 3-5 business days.</li>
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
                        <Label htmlFor="method">Withdrawal Method</Label>
                        <Select value={method} onValueChange={(v) => setMethod(v as WithdrawalMethod)}>
                            <SelectTrigger id="method">
                                <SelectValue placeholder="Select a method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bank_transfer"><div className="flex items-center gap-2"><Landmark className="h-4 w-4"/>Nigerian Bank Transfer</div></SelectItem>
                                <SelectItem value="paypal"><div className="flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M3.935 2.563C3.562 3.013 3.32 3.647 3.32 4.453V19.5c0 .33.076.643.22.924c.145.28.35.51.603.68c.256.17.553.255.88.255h.44a10.21 10.21 0 0 0 5.15-1.427c.48-.27.85-.63 1.22-1.018a.8.8 0 0 0 .12-.66c-.15-.49-.39-.98-.7-1.46c-.22-.35-.49-.66-.79-.94c-.2-.18-.46-.33-.76-.44c-.6-.2-1.28-.3-2.02-.3H9.28l-.05.01c-.18.03-.35.08-.48.17c-.14.09-.23.2-.28.32c-.06.12-.08.24-.07.36c.02.13.08.25.17.35l.48.5c.21.23.44.43.68.6a2.2 2.2 0 0 1 .4.32c.1.1.18.2.25.32c.07.11.1.23.1.36c0 .12-.03.24-.08.34c-.06.1-.14.19-.24.26c-.1.07-.22.12-.34.15c-.12.03-.25.04-.37.02c-.25-.03-.48-.12-.7-.22c-.22-.1-.4-.25-.56-.42l-.28-.3a.81.81 0 0 0-1.12.16c-.22.3-.2.71.04 1.02c.3.36.63.69.98.98c.35.3.73.56 1.12.79c.78.45 1.6.76 2.44.92c.2.04.4.06.6.06h.3c.3 0 .58-.06.84-.18c.26-.12.5-.29.7-.51c.2-.22.36-.48.48-.78c.12-.3.18-.62.18-.95v-1.2h.02c2.4-.06 4.34-1.02 5.72-2.88c.6-1.02 1-2.26 1-3.7c0-.9-.15-1.78-.45-2.6a4.5 4.5 0 0 0-1.22-1.84a5.5 5.5 0 0 0-1.8-1.22A8.3 8.3 0 0 0 14.56 2H8.38C6.96 2 5.76 2.19 4.8 2.563m1.32 1.63c.7-.28 1.5-.42 2.38-.42h5.8a6.5 6.5 0 0 1 4.25 1.5c.8.6 1.35 1.45 1.65 2.53c.3 1.08.45 2.2.45 3.38c0 1.2-.14 2.3-.43 3.3c-.3.99-.75 1.8-1.35 2.45c-.6.64-1.35 1.12-2.25 1.43c-.9.3-1.9.46-3 .46H8.76c-.68 0-1.28-.13-1.8-.4c-.5-.26-.95-.6-1.32-1.01c-.19-.2-.36-.43-.5-.68c-.15-.25-.26-.52-.34-.8c-.08-.28-.12-.58-.12-.88v-8.1c0-.4.07-.78.2-1.14c.14-.36.33-.68.58-.96c.25-.28.55-.5.9-.66Z"/></svg>PayPal</div></SelectItem>
                                <SelectItem value="gift_card"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4"/>Gift Card (Email)</div></SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {method === 'bank_transfer' && (
                     <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-in fade-in">
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                                id="bankName"
                                type="text"
                                placeholder="e.g., Kuda Bank"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input
                                id="accountNumber"
                                type="text"
                                placeholder="10-digit number"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                maxLength={10}
                            />
                        </div>
                    </div>
                )}
                 {method === 'paypal' && (
                     <div className="space-y-2 animate-in fade-in">
                        <Label htmlFor="paypalEmail">PayPal Email</Label>
                        <Input
                            id="paypalEmail"
                            type="email"
                            placeholder="you@example.com"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                        />
                    </div>
                )}
                
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
