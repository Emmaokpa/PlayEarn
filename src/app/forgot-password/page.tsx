
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
import { z } from 'zod';
import Link from 'next/link';
import { Gamepad2, Send } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useState } from 'react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await sendPasswordResetEmail(auth, values.email);
      setIsSubmitted(true);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for instructions.',
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'An unknown error occurred. Please try again.';
      if (error.code === 'auth/user-not-found') {
        // To avoid user enumeration, we can show a generic message.
        // Or, for better UX, we can inform them, which is what we'll do here.
        errorMessage = 'No account found with this email address.';
      }
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: errorMessage,
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
          <h1 className="text-4xl font-bold font-headline">Forgot Password?</h1>
          <p className="text-center text-muted-foreground">
            No problem. Enter your email below and we'll send you a link to reset it.
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-4">
            <p className="text-green-500">
              If an account with that email exists, a password reset link has been sent. Please check your inbox and spam folder.
            </p>
            <Button asChild>
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
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
                  <Send className="mr-2 h-4 w-4" />
                  {form.formState.isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remembered your password?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log In
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
