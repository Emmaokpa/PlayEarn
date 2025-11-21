
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import AppLayout from '@/components/layout/app-layout';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { doc, addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const affiliateFormSchema = z.object({
  title: z.string().min(2, { message: 'Offer title is required.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  link: z.string().url({ message: 'Please enter a valid affiliate URL.' }),
  imageHint: z.string().min(2, { message: 'Image hint is required.' }),
  rewardCoins: z.coerce.number().min(1, { message: 'Reward must be at least 1 coin.' }),
});

const stickerPackFormSchema = z.object({
  name: z.string().min(2, { message: 'Pack name is required.' }),
  description: z.string().min(2, { message: 'Description is required.' }),
  price: z.coerce.number().min(0, { message: 'Price cannot be negative.' }),
  imageHint: z.string().min(2, { message: 'Image hint is required.' }),
});


function AddAffiliateOfferForm() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof affiliateFormSchema>>({
    resolver: zodResolver(affiliateFormSchema),
    defaultValues: { title: '', description: '', link: '', imageHint: '', rewardCoins: 1000 },
  });

  async function onSubmit(values: z.infer<typeof affiliateFormSchema>) {
    if (!firestore) return;
    try {
      await addDoc(collection(firestore, 'affiliateOffers'), { ...values, imageUrl: `https://picsum.photos/seed/${values.title}/400/300` });
      toast({ title: 'Affiliate Offer Added!', description: `The "${values.title}" offer is now live.` });
      form.reset();
    } catch (error) {
      console.error('Error adding offer: ', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add the offer.' });
    }
  }

    return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Offer Title</FormLabel> <FormControl> <Input placeholder="e.g. BC.Game Sign Up" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl> <Input placeholder="Sign up for this awesome service and get..." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="link" render={({ field }) => ( <FormItem> <FormLabel>Affiliate Link</FormLabel> <FormControl> <Input placeholder="https://example.com/aff_id=123" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="rewardCoins" render={({ field }) => ( <FormItem> <FormLabel>Coin Reward</FormLabel> <FormControl> <Input type="number" placeholder="1000" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="imageHint" render={({ field }) => ( <FormItem> <FormLabel>Image AI Hint</FormLabel> <FormControl> <Input placeholder="e.g. casino chips" {...field} /> </FormControl> <FormDescription>This hint will be used for AI image generation.</FormDescription> <FormMessage /> </FormItem> )} />
        <Button type="submit" disabled={form.formState.isSubmitting}> {form.formState.isSubmitting ? 'Adding Offer...' : 'Add Offer'} </Button>
      </form>
    </Form>
  );
}

function AddStickerPackForm() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof stickerPackFormSchema>>({
    resolver: zodResolver(stickerPackFormSchema),
    defaultValues: { name: '', description: '', price: 100, imageHint: '' },
  });

  async function onSubmit(values: z.infer<typeof stickerPackFormSchema>) {
    if (!firestore) return;
    try {
      await addDoc(collection(firestore, 'stickerPacks'), { ...values, imageUrl: `https://picsum.photos/seed/${values.name}/300/300` });
      toast({ title: 'Sticker Pack Added!', description: `The "${values.name}" pack is now available in the store.` });
      form.reset();
    } catch (error) {
      console.error('Error adding sticker pack: ', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add the sticker pack.' });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Pack Name</FormLabel> <FormControl> <Input placeholder="e.g. Cool Cats" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl> <Input placeholder="A collection of cool cat stickers." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel>Price (in Coins)</FormLabel> <FormControl> <Input type="number" placeholder="500" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
        <FormField control={form.control} name="imageHint" render={({ field }) => ( <FormItem> <FormLabel>Image AI Hint</FormLabel> <FormControl> <Input placeholder="e.g. funny cat" {...field} /> </FormControl> <FormDescription>This hint will be used for AI image generation.</FormDescription> <FormMessage /> </FormItem> )} />
        <Button type="submit" disabled={form.formState.isSubmitting}> {form.formState.isSubmitting ? 'Adding Pack...' : 'Add Sticker Pack'} </Button>
      </form>
    </Form>
  );
}


function AdminDashboard() {
  return (
    <Tabs defaultValue="affiliates" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="affiliates">Manage Affiliates</TabsTrigger>
        <TabsTrigger value="stickers">Manage Stickers</TabsTrigger>
      </TabsList>
      <TabsContent value="affiliates">
         <Card>
          <CardHeader>
            <CardTitle>Add a New Affiliate Offer</CardTitle>
            <CardDescription>Fill out the form to add a new offer for users.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddAffiliateOfferForm />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="stickers">
         <Card>
          <CardHeader>
            <CardTitle>Add a New Sticker Pack</CardTitle>
            <CardDescription>Fill out the form to add a new sticker pack to the store.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddStickerPackForm />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default function AdminPage() {
  const { user, firestore } = useFirebase();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  if (isLoading) {
    return (
        <AppLayout title="Admin">
            <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-96 w-full" />
            </div>
        </AppLayout>
    )
  }

  if (!userProfile?.isAdmin) {
    return (
      <AppLayout title="Access Denied">
        <Card className="mt-10 border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view this page.</p>
            <p className="text-sm text-muted-foreground">
              Please contact an administrator if you believe this is a mistake.
            </p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin Dashboard">
      <AdminDashboard />
    </AppLayout>
  );
}
