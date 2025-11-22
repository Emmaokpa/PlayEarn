'use client';

import {useState} from 'react';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  generateStory,
  StoryGeneratorInputSchema,
  StoryGeneratorOutput,
} from '@/ai/schemas';

import AppLayout from '@/components/layout/app-layout';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {useFirebase, useDoc, useMemoFirebase} from '@/firebase';
import {doc} from 'firebase/firestore';
import type {UserProfile} from '@/lib/data';
import {Crown, Loader2, Sparkles, Wand2} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import Link from 'next/link';

function StoryGeneratorForm() {
  const [generation, setGeneration] = useState<StoryGeneratorOutput | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.infer<typeof StoryGeneratorInputSchema>>({
    resolver: zodResolver(StoryGeneratorInputSchema),
    defaultValues: {
      prompt: '',
    },
  });

  async function onSubmit(values: z.infer<typeof StoryGeneratorInputSchema>) {
    setIsGenerating(true);
    setGeneration(null);
    try {
      const result = await generateStory(values);
      setGeneration(result);
    } catch (error) {
      console.error('Story generation failed:', error);
      // You could show a toast message here
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Story Generator</CardTitle>
          <CardDescription>
            Use your imagination to create a unique story with the power of AI.
            Enter a prompt below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="prompt"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Your Story Idea</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., A lonely robot who finds a mysterious, glowing flower in a post-apocalyptic wasteland..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 />
                    Generate Story
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isGenerating && (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}

      {generation && (
        <Card className="animate-in fade-in">
          <CardHeader>
            <CardTitle>{generation.title}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm prose-invert max-w-none whitespace-pre-line">
            {generation.story}
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setGeneration(null)}>
              Create Another Story
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function VipUpgradePrompt() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Card className="max-w-md border-primary/30 bg-gradient-to-br from-primary/20 to-accent/20 p-6">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl text-white">
            Unlock the AI Story Generator
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            This is an exclusive feature for our VIP members. Upgrade now to
            unleash your creativity and generate unlimited stories with AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/profile">
              <Crown className="mr-2" />
              Upgrade to VIP
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreatePage() {
  const {user, firestore} = useFirebase();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const {data: userProfile, isLoading} = useDoc<UserProfile>(userProfileRef);

  if (isLoading) {
    return (
      <AppLayout title="Create">
        <Skeleton className="h-64 w-full" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Create with AI">
      {userProfile?.isVip ? <StoryGeneratorForm /> : <VipUpgradePrompt />}
    </AppLayout>
  );
}
