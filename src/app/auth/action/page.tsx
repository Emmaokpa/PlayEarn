
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Gamepad2, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const passwordFormSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


function PasswordResetForm({ actionCode }: { actionCode: string }) {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: z.infer<typeof passwordFormSchema>) {
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, actionCode, values.password);
      setIsSuccess(true);
      toast({
        title: 'Password Changed!',
        description: 'You can now log in with your new password.',
      });
    } catch (error: any) {
      console.error("Password reset confirmation error:", error);
      let description = "Could not reset your password. The link may have expired or been used already.";
      if (error.code === 'auth/expired-action-code') {
        description = "This password reset link has expired. Please request a new one.";
      } else if (error.code === 'auth/invalid-action-code') {
        description = "This link is invalid or has already been used. Please request a new one.";
      }
      toast({ variant: 'destructive', title: 'Error', description });
      // Optionally redirect or show an error state
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isSuccess) {
    return (
        <div className="text-center space-y-4 flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold">Success!</h2>
            <p className="text-muted-foreground">Your password has been changed successfully.</p>
            <Button asChild>
                <Link href="/login">Return to Login</Link>
            </Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? 'Changing Password...' : 'Change Password'}
        </Button>
      </form>
    </Form>
  );
}


function AuthActionHandler() {
  const searchParams = useSearchParams();
  const auth = useAuth();

  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode');

  const [verificationState, setVerificationState] = useState<'verifying' | 'valid' | 'invalid'>('verifying');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    if (mode === 'resetPassword' && actionCode) {
      verifyPasswordResetCode(auth, actionCode)
        .then(() => {
          setVerificationState('valid');
        })
        .catch((error) => {
          console.error("Invalid action code:", error);
           if (error.code === 'auth/expired-action-code') {
            setErrorDetails("This password reset link has expired. Please request a new one from the 'Forgot Password' page.");
          } else {
            setErrorDetails("This link is invalid or has already been used. Please request a new link.");
          }
          setVerificationState('invalid');
        });
    } else {
        setErrorDetails("The link is missing necessary information. Please try the action again.");
        setVerificationState('invalid');
    }
  }, [mode, actionCode, auth]);


  const renderContent = () => {
    switch (verificationState) {
      case 'verifying':
        return <Skeleton className="h-48 w-full" />;
      case 'invalid':
        return (
            <div className="text-center space-y-4 flex flex-col items-center">
                <AlertCircle className="h-16 w-16 text-destructive" />
                <h2 className="text-2xl font-bold">Invalid Link</h2>
                <p className="text-muted-foreground">{errorDetails}</p>
                <Button asChild>
                    <Link href="/forgot-password">Get a New Link</Link>
                </Button>
            </div>
        );
      case 'valid':
        if (mode === 'resetPassword' && actionCode) {
          return <PasswordResetForm actionCode={actionCode} />;
        }
        // Handle other modes like 'verifyEmail' here in the future
        return <p>Unsupported action.</p>;
      default:
        return null;
    }
  };
  
   const getTitle = () => {
    if (verificationState === 'invalid') return "Link Error";
    switch (mode) {
        case 'resetPassword': return "Reset Your Password";
        case 'verifyEmail': return "Verify Your Email";
        default: return "Authentication Action";
    }
   }
   
   const getDescription = () => {
    if (verificationState === 'valid' && mode === 'resetPassword') {
        return "Choose a new, strong password for your account.";
    }
    return "Please follow the instructions to complete your action.";
   }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <KeyRound className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold font-headline">{getTitle()}</h1>
          <p className="text-center text-muted-foreground">{getDescription()}</p>
        </div>
        
        {renderContent()}

      </div>
    </main>
  );
}


export default function ActionPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthActionHandler />
        </Suspense>
    );
}

