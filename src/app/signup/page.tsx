
'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  signInWithPopup,
} from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { Gamepad2, Check, X, Loader2 } from 'lucide-react';
import {
  doc,
  serverTimestamp,
  writeBatch,
  query,
  collection,
  where,
  getDocs,
  limit,
  increment, setDoc,
} from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
  referralCode: z.string().optional(),
});

type ReferralStatus = 'idle' | 'loading' | 'valid' | 'invalid';

export default function SignUpPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const [referralStatus, setReferralStatus] = useState<ReferralStatus>('idle');
  const [referrerId, setReferrerId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      referralCode: '',
    },
  });

  const referralCode = form.watch('referralCode');
  const debouncedReferralCode = useDebounce(referralCode, 500);

  const validateReferralCode = useCallback(
    async (code: string) => {
      if (!firestore) return;
      if (!code) {
        setReferralStatus('idle');
        setReferrerId(null);
        return;
      }
      setReferralStatus('loading');
      try {
        const q = query(
          collection(firestore, 'users'),
          where('referralCode', '==', code.trim().toUpperCase()),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setReferralStatus('valid');
          setReferrerId(querySnapshot.docs[0].id);
        } else {
          setReferralStatus('invalid');
          setReferrerId(null);
        }
      } catch (error) {
        console.error('Referral validation error:', error);
        setReferralStatus('idle');
        setReferrerId(null);
      }
    },
    [firestore]
  );

  useEffect(() => {
    validateReferralCode(debouncedReferralCode ?? '');
  }, [debouncedReferralCode, validateReferralCode]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !auth) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized. Please try again later.',
      });
      return;
    }
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      const batch = writeBatch(firestore);
      let initialCoins = 10; // Default starting coins
      const referralReward = 100;

      // 2. Handle referral if code is valid and referrerId is set
      if (referralStatus === 'valid' && referrerId) {
        const referrerRef = doc(firestore, 'users', referrerId);
        batch.update(referrerRef, {
          coins: increment(referralReward),
        });
        initialCoins += referralReward; // Give bonus to new user
        toast({
          title: 'Referral Applied!',
          description: `You and your friend both received ${referralReward.toLocaleString()} coins!`,
        });
      } else if (values.referralCode) {
        // If code was entered but is invalid, inform the user
        toast({
          variant: 'destructive',
          title: 'Invalid Referral Code',
          description: 'Continuing sign-up without bonus.',
        });
      }


      // 3. Create new user's profile in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      batch.set(userDocRef, {
        id: user.uid,
        telegramId: user.uid, // Using UID as a placeholder
        username: values.name.toLowerCase().replace(/\s/g, ''), // simple username
        name: values.name,
        avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`, // Placeholder
        coins: initialCoins, // Starting coins + referral bonus
        referralCode: `${user.uid.substring(0, 6).toUpperCase()}`,
        isVip: false,
        isAdmin: false, // New users are never admins
        registrationDate: serverTimestamp(),
        gamePlaysToday: 0,
        lastGameplayReset: new Date().toISOString().split('T')[0],
      });

      // 4. Commit all database changes
      await batch.commit();

      toast({
        title: 'Account Created!',
        description: "Welcome to RewardPlay! We're glad to have you.",
      });

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'An unknown error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please log in.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: errorMessage,
      });
    }
  }

  async function handleGoogleSignIn() {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized. Please try again later.',
      });
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);

      // Check if it's a new user
      if (additionalUserInfo?.isNewUser) {
        // Create a new user profile in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
          id: user.uid,
          telegramId: user.uid, // Using UID as a placeholder
          username: (user.displayName || user.email?.split('@')[0] || 'user')
            .toLowerCase()
            .replace(/\s/g, ''),
          name: user.displayName || 'New User',
          avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
          coins: 10, // Default starting coins
          referralCode: `${user.uid.substring(0, 6).toUpperCase()}`,
          isVip: false,
          isAdmin: false,
          registrationDate: serverTimestamp(),
          gamePlaysToday: 0,
          lastGameplayReset: new Date().toISOString().split('T')[0],
        });
        toast({
          title: 'Account Created!',
          description: "Welcome to RewardPlay! We're glad to have you.",
        });
      } else {
        toast({
          title: 'Login Successful!',
          description: 'Welcome back!',
        });
      }

      router.push('/dashboard');
    } catch (error: any) {
      // Don't show a toast if the user closes the popup
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('Google Sign-In error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'An unknown error occurred during Google Sign-In.',
      });
    }
  }

  const renderReferralStatus = () => {
    switch (referralStatus) {
      case 'loading':
        return <p className="text-xs text-muted-foreground flex items-center mt-2"><Loader2 className="h-3 w-3 mr-1 animate-spin"/>Checking code...</p>;
      case 'valid':
        return <p className="text-xs text-green-500 flex items-center mt-2"><Check className="h-3 w-3 mr-1"/>Referral Applied!</p>;
      case 'invalid':
        return <p className="text-xs text-destructive flex items-center mt-2"><X className="h-3 w-3 mr-1"/>Invalid code</p>;
      default:
        return <FormDescription>Enter a code to get a bonus!</FormDescription>;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Gamepad2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold font-headline">
            Create an Account
          </h1>
          <p className="text-muted-foreground">
            Join the fun and start earning!
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referralCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC123" {...field} />
                  </FormControl>
                  {renderReferralStatus()}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? 'Creating Account...'
                : 'Sign Up'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            Sign in with Google
          </Button>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {'Already have an account? '}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Log In
          </Link>
        </p>
      </div>
    </main>
  );
}
