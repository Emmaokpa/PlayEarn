
'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  GoogleAuthProvider,
  getAdditionalUserInfo,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import GoogleIcon from '@/components/app/google-icon';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(1, { message: 'Password is required.' }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login Successful!',
        description: "Welcome back!",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'An unknown error occurred.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Gamepad2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold font-headline">Welcome Back!</h1>
          <p className="text-muted-foreground">Log in to continue your journey.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <div className="flex justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link href="/forgot-password" passHref legacyBehavior>
                      <a className="text-sm text-primary hover:underline">Forgot Password?</a>
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
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
              {form.formState.isSubmitting ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </Form>

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
          <GoogleIcon className="mr-2 h-4 w-4" />
          Sign in with Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {"Don't have an account?"}{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}
