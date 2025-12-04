
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
import { useFirebase, useDoc, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { Game, UserProfile, Reward, InAppPurchase, AffiliateOffer, AffiliateSubmission, RewardFulfillment, WithdrawalRequest, StickerPack } from '@/lib/data';
import { doc, addDoc, collection, setDoc, deleteDoc, writeBatch, increment, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Trash2, Edit, List, Database, Check, X, ExternalLink, PackageCheck, LayoutDashboard, FilePen, Cog, Banknote } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, use } from 'react';
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
import ImageUpload from '@/components/app/ImageUpload';
import { Switch } from '@/components/ui/switch';
import { seedDatabase } from '@/lib/seed';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const gameFormSchema = z.object({
  name: z.string().min(2, { message: 'Game name is required.' }),
  category: z.string().min(2, { message: 'Category is required.' }),
  iframeUrl: z.string().url({ message: 'Please enter a valid iframe URL.' }),
  imageUrl: z.string().url({ message: 'An image URL is required.' }).min(1, { message: 'Please upload an image.' }),
});

const rewardFormSchema = z.object({
    name: z.string().min(2, { message: 'Reward name is required.' }),
    description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
    coins: z.coerce.number().min(1, { message: 'Cost must be at least 1 coin.' }),
    type: z.enum(['virtual', 'physical'], { required_error: "You must select a reward type." }),
    isVipOnly: z.boolean().default(false),
    imageUrl: z.string().url({ message: 'An image URL is required.' }).min(1, { message: 'Please upload an image.' }),
});

const iapFormSchema = z.object({
  name: z.string().min(2, { message: "Pack name is required." }),
  description: z.string().min(2, { message: "Description is required." }),
  type: z.enum(["coins", "spins"], { required_error: "You must select a pack type." }),
  amount: z.coerce.number().min(1, { message: "Amount must be at least 1." }),
  price: z.coerce.number().min(0.01, { message: "Price must be greater than 0." }),
  imageUrl: z.string().url({ message: "An image URL is required." }).min(1, { message: "Please upload an image." }),
});

const affiliateFormSchema = z.object({
  title: z.string().min(2, { message: 'Offer title is required.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  link: z.string().url({ message: 'Please enter a valid affiliate URL.' }),
  imageUrl: z.string().url({ message: 'An image URL is required.' }).min(1, { message: 'Please upload an image.' }),
  rewardCoins: z.coerce.number().min(1, { message: 'Reward must be at least 1 coin.' }),
});

const stickerPackFormSchema = z.object({
  name: z.string().min(2, { message: 'Pack name is required.' }),
  description: z.string().min(2, { message: 'Description is required.' }),
  price: z.coerce.number().min(0, { message: 'Price cannot be negative.' }),
  imageUrl: z.string().url({ message: 'An image URL is required.' }).min(1, { message: 'Please upload an image.' }),
});

function AddGameForm({
  selectedGame,
  onClearSelection,
}: {
  selectedGame: Game | null;
  onClearSelection: () => void;
}) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof gameFormSchema>>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: { name: '', category: '', iframeUrl: '', imageUrl: '' },
  });

  useEffect(() => {
    form.reset(selectedGame || { name: '', category: '', iframeUrl: '', imageUrl: '' });
  }, [selectedGame, form]);

  async function onSubmit(values: z.infer<typeof gameFormSchema>) {
    if (!firestore) return;
    try {
      const imageHint = values.name.split(' ').slice(0, 2).join(' ');
      
      if (selectedGame) {
        const gameRef = doc(firestore, 'games', selectedGame.id);
        await setDoc(gameRef, { ...values, imageHint }, { merge: true });
        toast({ title: 'Game Updated!', description: `"${values.name}" has been updated.` });
      } else {
        const newGameRef = doc(collection(firestore, 'games'));
        await setDoc(newGameRef, { 
            ...values,
            id: newGameRef.id,
            imageHint: imageHint,
        });
        toast({ title: 'Game Added!', description: `"${values.name}" is now available to play.` });
      }
      form.reset({ name: '', category: '', iframeUrl: '', imageUrl: '' });
      onClearSelection();
    } catch (error) {
      console.error('Error saving game: ', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the game.' });
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedGame ? 'Edit Game' : 'Add New Game'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Asphalt Racing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Racing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="iframeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Iframe URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/game-embed" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Image</FormLabel>
                  <FormControl>
                    <ImageUpload 
                      onUpload={(url) => form.setValue('imageUrl', url, { shouldValidate: true })}
                      initialImageUrl={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : (selectedGame ? 'Update Game' : 'Add Game')}
                </Button>
                {selectedGame && (
                  <Button variant="outline" onClick={onClearSelection}>
                    Cancel Edit
                  </Button>
                )}
              </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function GameList({ onEdit, onDelete, games, isLoading }: { onEdit: (game: Game) => void; onDelete: (gameId: string) => void; games: Game[] | null, isLoading: boolean }) {
  if (isLoading) {
    return (
        <Card>
            <CardHeader><CardTitle>Manage Games</CardTitle></CardHeader>
            <CardContent><div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent>
        </Card>
    )
  }
  
  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><List /> Manage Games</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-2">
                {games?.map((game) => (
                    <li key={game.id} className="flex items-center justify-between rounded-md border p-3">
                        <span className="font-semibold truncate pr-2">{game.name}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => onEdit(game)}><Edit className="h-4 w-4" /></Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{game.name}".</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(game.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </li>
                ))}
                {games?.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No games found.</p>}
            </ul>
        </CardContent>
    </Card>
  )
}

function AddRewardForm({ selectedReward, onClearSelection }: { selectedReward: Reward | null; onClearSelection: () => void; }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof rewardFormSchema>>({
        resolver: zodResolver(rewardFormSchema),
        defaultValues: { name: '', description: '', coins: 100, type: 'virtual', isVipOnly: false, imageUrl: '' },
    });

    useEffect(() => {
        form.reset(selectedReward || { name: '', description: '', coins: 100, type: 'virtual', isVipOnly: false, imageUrl: '' });
    }, [selectedReward, form]);

    async function onSubmit(values: z.infer<typeof rewardFormSchema>) {
        if (!firestore) return;
        try {
            const imageHint = values.name.split(' ').slice(0, 2).join(' ');
            if (selectedReward) {
                const rewardRef = doc(firestore, 'rewards', selectedReward.id);
                await setDoc(rewardRef, { ...values, imageHint }, { merge: true });
                toast({ title: 'Reward Updated!', description: `"${values.name}" has been updated.` });
            } else {
                const newRewardRef = doc(collection(firestore, 'rewards'));
                await setDoc(newRewardRef, { ...values, id: newRewardRef.id, imageHint });
                toast({ title: 'Reward Added!', description: `"${values.name}" is now available.` });
            }
            form.reset({ name: '', description: '', coins: 100, type: 'virtual', isVipOnly: false, imageUrl: '' });
            onClearSelection();
        } catch (error) {
            console.error('Error saving reward: ', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the reward.' });
        }
    }

    return (
        <Card>
            <CardHeader><CardTitle>{selectedReward ? 'Edit Reward' : 'Add New Reward'}</CardTitle></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Reward Name</FormLabel><FormControl><Input placeholder="e.g. $5 Gift Card" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="A gift card for your favorite store." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="coins" render={({ field }) => ( <FormItem><FormLabel>Cost (Coins)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select reward type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="virtual">Virtual (In-game item)</SelectItem>
                                        <SelectItem value="physical">Physical (e.g., Gift Card)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    'Physical' rewards will create a fulfillment request for admins.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>Reward Image</FormLabel><FormControl><ImageUpload onUpload={(url) => form.setValue('imageUrl', url, { shouldValidate: true })} initialImageUrl={field.value} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="isVipOnly" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>VIP Only</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Saving...' : (selectedReward ? 'Update Reward' : 'Add Reward')}</Button>
                            {selectedReward && (<Button variant="outline" onClick={onClearSelection}>Cancel Edit</Button>)}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function RewardList({ onEdit, onDelete, rewards, isLoading }: { onEdit: (reward: Reward) => void; onDelete: (rewardId: string) => void; rewards: Reward[] | null, isLoading: boolean }) {
    if (isLoading) {
      return (
          <Card>
              <CardHeader><CardTitle>Manage Rewards</CardTitle></CardHeader>
              <CardContent><div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent>
          </Card>
      )
    }
    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><List /> Manage Rewards</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {rewards?.map((reward) => (
                        <li key={reward.id} className="flex items-center justify-between rounded-md border p-3">
                            <span className="font-semibold truncate pr-2">{reward.name}</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={() => onEdit(reward)}><Edit className="h-4 w-4" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{reward.name}".</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(reward.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                    {rewards?.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No rewards found.</p>}
                </ul>
            </CardContent>
        </Card>
    )
}

function AddIAPForm({ selectedPack, onClearSelection }: { selectedPack: InAppPurchase | null; onClearSelection: () => void; }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof iapFormSchema>>({
        resolver: zodResolver(iapFormSchema),
        defaultValues: { name: '', description: '', type: 'coins', amount: 1, price: 0.99, imageUrl: '' },
    });

    useEffect(() => {
        form.reset(selectedPack || { name: '', description: '', type: 'coins', amount: 1, price: 0.99, imageUrl: '' });
    }, [selectedPack, form]);

    async function onSubmit(values: z.infer<typeof iapFormSchema>) {
        if (!firestore) return;
        try {
            const imageHint = values.name.split(' ').slice(0, 2).join(' ');
            if (selectedPack) {
                const packRef = doc(firestore, 'inAppPurchases', selectedPack.id);
                await setDoc(packRef, { ...values, imageHint }, { merge: true });
                toast({ title: 'Pack Updated!', description: `"${values.name}" has been updated.` });
            } else {
                const newPackRef = doc(collection(firestore, 'inAppPurchases'));
                await setDoc(newPackRef, { ...values, id: newPackRef.id, imageHint });
                toast({ title: 'Pack Added!', description: `"${values.name}" is now available in the store.` });
            }
            form.reset({ name: '', description: '', type: 'coins', amount: 1, price: 0.99, imageUrl: '' });
            onClearSelection();
        } catch (error) {
            console.error('Error saving pack: ', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the pack.' });
        }
    }

    return (
        <Card>
            <CardHeader><CardTitle>{selectedPack ? 'Edit Purchase Pack' : 'Add New Purchase Pack'}</CardTitle></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Pack Name</FormLabel><FormControl><Input placeholder="e.g. Starter Coin Pack" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Get a head start with this pack." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="type" render={({ field }) => (
                             <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a pack type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="coins">Coins</SelectItem>
                                        <SelectItem value="spins">Spins</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Price (USD)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.99" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>Pack Image</FormLabel><FormControl><ImageUpload onUpload={(url) => form.setValue('imageUrl', url, { shouldValidate: true })} initialImageUrl={field.value} /></FormControl><FormMessage /></FormItem> )} />
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Saving...' : (selectedPack ? 'Update Pack' : 'Add Pack')}</Button>
                            {selectedPack && (<Button variant="outline" onClick={onClearSelection}>Cancel Edit</Button>)}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function IAPList({ onEdit, onDelete, packs, isLoading }: { onEdit: (pack: InAppPurchase) => void; onDelete: (packId: string) => void; packs: InAppPurchase[] | null, isLoading: boolean }) {
    if (isLoading) {
      return (
          <Card>
              <CardHeader><CardTitle>Manage Purchases</CardTitle></CardHeader>
              <CardContent><div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent>
          </Card>
      )
    }
    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><List /> Manage In-App Purchases</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {packs?.map((pack) => (
                        <li key={pack.id} className="flex items-center justify-between rounded-md border p-3">
                            <span className="font-semibold truncate pr-2">{pack.name} ({pack.type})</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={() => onEdit(pack)}><Edit className="h-4 w-4" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{pack.name}".</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(pack.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                    {packs?.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No purchase packs found.</p>}
                </ul>
            </CardContent>
        </Card>
    )
}

function AddAffiliateForm({ selectedOffer, onClearSelection }: { selectedOffer: AffiliateOffer | null; onClearSelection: () => void; }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof affiliateFormSchema>>({
        resolver: zodResolver(affiliateFormSchema),
        defaultValues: { title: '', description: '', link: '', imageUrl: '', rewardCoins: 1000 },
    });

    useEffect(() => {
        form.reset(selectedOffer || { title: '', description: '', link: '', imageUrl: '', rewardCoins: 1000 });
    }, [selectedOffer, form]);

    async function onSubmit(values: z.infer<typeof affiliateFormSchema>) {
        if (!firestore) return;
        try {
            const imageHint = values.title.split(' ').slice(0, 2).join(' ');
            if (selectedOffer) {
                const offerRef = doc(firestore, 'affiliateOffers', selectedOffer.id);
                await setDoc(offerRef, { ...values, imageHint }, { merge: true });
                toast({ title: 'Offer Updated!', description: `"${values.title}" has been updated.` });
            } else {
                const newOfferRef = doc(collection(firestore, 'affiliateOffers'));
                await setDoc(newOfferRef, { ...values, id: newOfferRef.id, imageHint, createdAt: serverTimestamp() });
                toast({ title: 'Offer Added!', description: `"${values.title}" is now available.` });
            }
            form.reset({ title: '', description: '', link: '', imageUrl: '', rewardCoins: 1000 });
            onClearSelection();
        } catch (error) {
            console.error('Error saving offer: ', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the offer.' });
        }
    }

    return (
        <Card>
            <CardHeader><CardTitle>{selectedOffer ? 'Edit Affiliate Offer' : 'Add New Affiliate Offer'}</CardTitle></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Offer Title</FormLabel><FormControl><Input placeholder="e.g. Sign Up for Awesome Service" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Get 10,000 coins for signing up!" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="link" render={({ field }) => ( <FormItem><FormLabel>Affiliate URL</FormLabel><FormControl><Input placeholder="https://partner.com/track?id=123" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="rewardCoins" render={({ field }) => ( <FormItem><FormLabel>Reward (Coins)</FormLabel><FormControl><Input type="number" placeholder="10000" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>Offer Image</FormLabel><FormControl><ImageUpload onUpload={(url) => form.setValue('imageUrl', url, { shouldValidate: true })} initialImageUrl={field.value} /></FormControl><FormMessage /></FormItem> )} />
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Saving...' : (selectedOffer ? 'Update Offer' : 'Add Offer')}</Button>
                            {selectedOffer && (<Button variant="outline" onClick={onClearSelection}>Cancel Edit</Button>)}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function AffiliateList({ onEdit, onDelete, offers, isLoading }: { onEdit: (offer: AffiliateOffer) => void; onDelete: (offerId: string) => void; offers: AffiliateOffer[] | null, isLoading: boolean }) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Manage Affiliate Offers</CardTitle></CardHeader>
                <CardContent><div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent>
            </Card>
        )
    }
    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><List /> Manage Affiliate Offers</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {offers?.map((offer) => (
                        <li key={offer.id} className="flex items-center justify-between rounded-md border p-3">
                            <span className="font-semibold truncate pr-2">{offer.title}</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={() => onEdit(offer)}><Edit className="h-4 w-4" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{offer.title}".</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(offer.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                    {offers?.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No affiliate offers found.</p>}
                </ul>
            </CardContent>
        </Card>
    )
}

function AffiliateApprovalList() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const submissionsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'affiliateSubmissions'), where('status', '==', 'pending')) : null,
      [firestore]
    );
    const { data: submissions, isLoading } = useCollection<AffiliateSubmission>(submissionsQuery);

    const handleApproval = (submission: AffiliateSubmission, newStatus: 'approved' | 'rejected') => {
        if (!firestore) return;

        const batch = writeBatch(firestore);
        
        const submissionRef = doc(firestore, 'affiliateSubmissions', submission.id);
        batch.update(submissionRef, { status: newStatus });

        const userSubmissionRef = doc(firestore, `users/${submission.userId}/affiliateSignups`, submission.offerId);
        
        let userUpdateData: { status: string; approvedAt?: any } = { status: newStatus };
        if (newStatus === 'approved') {
            const userRef = doc(firestore, 'users', submission.userId);
            batch.update(userRef, { coins: increment(submission.rewardAmount) });
            userUpdateData.approvedAt = serverTimestamp();
        }
        batch.set(userSubmissionRef, userUpdateData, { merge: true });
        
        batch.commit()
            .then(() => {
                toast({
                    title: `Submission ${newStatus}`,
                    description: `${submission.userName}'s submission for "${submission.offerTitle}" was ${newStatus}.`,
                });
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: submissionRef.path,
                    operation: 'write',
                    requestResourceData: { 
                        globalSubmission: { status: newStatus },
                        userSubmission: userUpdateData,
                        userCoinUpdate: newStatus === 'approved' ? { coins: `increment(${submission.rewardAmount})` } : undefined
                    },
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    const getFormattedDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true });
    };
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Pending Affiliate Approvals</CardTitle></CardHeader>
                <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Affiliate Approvals</CardTitle>
                <CardDescription>Review and approve or reject user submissions for affiliate offers.</CardDescription>
            </CardHeader>
            <CardContent>
                {submissions && submissions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Offer</TableHead>
                                <TableHead>Proof</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell>{s.userName}</TableCell>
                                    <TableCell>{s.offerTitle}</TableCell>
                                    <TableCell>
                                        {s.proofText && <p className="font-mono text-xs">{s.proofText}</p>}
                                        {s.proofImageUrl && (
                                            <Link href={s.proofImageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                                View Image <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{getFormattedDate(s.submittedAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button size="icon" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproval(s, 'approved')}><Check className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="destructive" onClick={() => handleApproval(s, 'rejected')}><X className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending submissions.</p>
                )}
            </CardContent>
        </Card>
    );
}

function FulfillmentQueue() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const fulfillmentsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'fulfillments'), where('status', '==', 'pending')) : null,
      [firestore]
    );
    const { data: fulfillments, isLoading } = useCollection<RewardFulfillment>(fulfillmentsQuery);

    const handleFulfillment = async (fulfillment: RewardFulfillment, newStatus: 'fulfilled' | 'error') => {
        if (!firestore) return;
        
        const batch = writeBatch(firestore);
        const fulfillmentRef = doc(firestore, 'fulfillments', fulfillment.id);

        let updateData: { status: 'fulfilled' | 'error'; fulfilledAt?: any } = { status: newStatus };

        if (newStatus === 'fulfilled') {
            updateData.fulfilledAt = serverTimestamp();
        }
        
        batch.update(fulfillmentRef, updateData);

        // If rejecting ('error'), refund the user's coins
        if (newStatus === 'error') {
            const userRef = doc(firestore, 'users', fulfillment.userId);
            batch.update(userRef, { coins: increment(fulfillment.rewardDetails.coins) });
        }
        
        try {
            await batch.commit();
            toast({
                title: `Request ${newStatus}`,
                description: `Request for "${fulfillment.rewardDetails.name}" was marked as ${newStatus}.${newStatus === 'error' ? ' Coins have been refunded.' : ''}`,
            });
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: fulfillmentRef.path,
                operation: 'write', // Batch write combines operations
                requestResourceData: { 
                    fulfillmentUpdate: updateData,
                    ...(newStatus === 'error' && { userRefund: { coins: `increment(${fulfillment.rewardDetails.coins})` } })
                },
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };

    const getFormattedDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Pending Reward Fulfillments</CardTitle></CardHeader>
                <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Reward Fulfillments</CardTitle>
                <CardDescription>Review and manually fulfill user requests for physical rewards.</CardDescription>
            </CardHeader>
            <CardContent>
                {fulfillments && fulfillments.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User Email</TableHead>
                                <TableHead>Reward</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fulfillments.map((f) => (
                                <TableRow key={f.id}>
                                    <TableCell className="font-semibold">{f.userEmail}</TableCell>
                                    <TableCell>{f.rewardDetails.name} ({f.rewardDetails.coins} coins)</TableCell>
                                    <TableCell className="text-muted-foreground">{getFormattedDate(f.requestedAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button size="icon" className="bg-green-600 hover:bg-green-700" onClick={() => handleFulfillment(f, 'fulfilled')}><PackageCheck className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="destructive" onClick={() => handleFulfillment(f, 'error')}><X className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending fulfillment requests.</p>
                )}
            </CardContent>
        </Card>
    );
}

function WithdrawalQueue() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const withdrawalsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'withdrawals'), where('status', '==', 'pending')) : null,
      [firestore]
    );
    const { data: withdrawals, isLoading } = useCollection<WithdrawalRequest>(withdrawalsQuery);

    const handleWithdrawal = async (withdrawal: WithdrawalRequest, newStatus: 'processed' | 'rejected') => {
        if (!firestore) return;
        
        const batch = writeBatch(firestore);
        const withdrawalRef = doc(firestore, 'withdrawals', withdrawal.id);

        let updateData: { status: 'processed' | 'rejected'; processedAt?: any } = { status: newStatus };

        if (newStatus === 'processed') {
            updateData.processedAt = serverTimestamp();
        }
        
        batch.update(withdrawalRef, updateData);

        // If rejecting, refund the user's coins
        if (newStatus === 'rejected') {
            const userRef = doc(firestore, 'users', withdrawal.userId);
            batch.update(userRef, { coins: increment(withdrawal.amountCoins) });
        }
        
        try {
            await batch.commit();
            toast({
                title: `Withdrawal ${newStatus}`,
                description: `${withdrawal.userName}'s request for $${withdrawal.netUsd.toFixed(2)} was ${newStatus}.${newStatus === 'rejected' ? ' Coins have been refunded.' : ''}`,
            });
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: withdrawalRef.path,
                operation: 'write',
                requestResourceData: { 
                    withdrawalUpdate: updateData,
                    ...(newStatus === 'rejected' && { userRefund: { coins: `increment(${withdrawal.amountCoins})` } })
                },
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };

    const getFormattedDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle>Pending Withdrawals</CardTitle></CardHeader>
                <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Cash Withdrawals</CardTitle>
                <CardDescription>Review and process user requests to withdraw coins for cash.</CardDescription>
            </CardHeader>
            <CardContent>
                {withdrawals && withdrawals.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {withdrawals.map((w) => (
                                <TableRow key={w.id}>
                                    <TableCell className="font-semibold">{w.userName}</TableCell>
                                    <TableCell className="font-semibold text-green-500">${w.netUsd.toFixed(2)}</TableCell>
                                    <TableCell className="font-mono text-xs">{w.recipientAddress}</TableCell>
                                    <TableCell className="text-muted-foreground">{getFormattedDate(w.requestedAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button size="icon" className="bg-green-600 hover:bg-green-700" onClick={() => handleWithdrawal(w, 'processed')}><Check className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="destructive" onClick={() => handleWithdrawal(w, 'rejected')}><X className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending withdrawal requests.</p>
                )}
            </CardContent>
        </Card>
    );
}

function AddStickerPackForm({ selectedPack, onClearSelection }: { selectedPack: StickerPack | null; onClearSelection: () => void; }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof stickerPackFormSchema>>({
        resolver: zodResolver(stickerPackFormSchema),
        defaultValues: { name: '', description: '', price: 100, imageUrl: '' },
    });

    useEffect(() => {
        form.reset(selectedPack || { name: '', description: '', price: 100, imageUrl: '' });
    }, [selectedPack, form]);

    async function onSubmit(values: z.infer<typeof stickerPackFormSchema>) {
        if (!firestore) return;
        try {
            const imageHint = values.name.split(' ').slice(0, 2).join(' ');
            if (selectedPack) {
                const packRef = doc(firestore, 'stickerPacks', selectedPack.id);
                await setDoc(packRef, { ...values, imageHint }, { merge: true });
                toast({ title: 'Pack Updated!', description: `"${values.name}" has been updated.` });
            } else {
                const newPackRef = doc(collection(firestore, 'stickerPacks'));
                await setDoc(newPackRef, { ...values, id: newPackRef.id, imageHint });
                toast({ title: 'Sticker Pack Added!', description: `"${values.name}" is now available in the store.` });
            }
            form.reset({ name: '', description: '', price: 100, imageUrl: '' });
            onClearSelection();
        } catch (error) {
            console.error('Error saving sticker pack: ', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the sticker pack.' });
        }
    }

    return (
        <Card>
            <CardHeader><CardTitle>{selectedPack ? 'Edit Sticker Pack' : 'Add New Sticker Pack'}</CardTitle></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Pack Name</FormLabel><FormControl><Input placeholder="e.g. Cute Cats Pack" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="A collection of adorable cat stickers." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Price (Coins)</FormLabel><FormControl><Input type="number" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>Pack Image</FormLabel><FormControl><ImageUpload onUpload={(url) => form.setValue('imageUrl', url, { shouldValidate: true })} initialImageUrl={field.value} /></FormControl><FormMessage /></FormItem> )} />
                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Saving...' : (selectedPack ? 'Update Pack' : 'Add Pack')}</Button>
                            {selectedPack && (<Button variant="outline" onClick={onClearSelection}>Cancel Edit</Button>)}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function StickerPackList({ onEdit, onDelete, packs, isLoading }: { onEdit: (pack: StickerPack) => void; onDelete: (packId: string) => void; packs: StickerPack[] | null, isLoading: boolean }) {
    if (isLoading) {
      return (
          <Card>
              <CardHeader><CardTitle>Manage Sticker Packs</CardTitle></CardHeader>
              <CardContent><div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent>
          </Card>
      )
    }
    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><List /> Manage Sticker Packs</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {packs?.map((pack) => (
                        <li key={pack.id} className="flex items-center justify-between rounded-md border p-3">
                            <span className="font-semibold truncate pr-2">{pack.name}</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={() => onEdit(pack)}><Edit className="h-4 w-4" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{pack.name}".</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(pack.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </li>
                    ))}
                    {packs?.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No sticker packs found.</p>}
                </ul>
            </CardContent>
        </Card>
    )
}

function AdminDashboard() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [selectedIap, setSelectedIap] = useState<InAppPurchase | null>(null);
    const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateOffer | null>(null);
    const [selectedStickerPack, setSelectedStickerPack] = useState<StickerPack | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);

    const gamesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'games') : null), [firestore]);
    const { data: games, isLoading: gamesLoading } = useCollection<Game>(gamesQuery);

    const rewardsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'rewards') : null), [firestore]);
    const { data: rewards, isLoading: rewardsLoading } = useCollection<Reward>(rewardsQuery);
    
    const iapsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'inAppPurchases') : null), [firestore]);
    const { data: iaps, isLoading: iapsLoading } = useCollection<InAppPurchase>(iapsQuery);
    
    const affiliatesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'affiliateOffers') : null), [firestore]);
    const { data: affiliates, isLoading: affiliatesLoading } = useCollection<AffiliateOffer>(affiliatesQuery);

    const stickerPacksQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'stickerPacks') : null), [firestore]);
    const { data: stickerPacks, isLoading: stickerPacksLoading } = useCollection<StickerPack>(stickerPacksQuery);

    const handleEdit = <T extends { id: string }>(item: T, setSelected: (item: T) => void) => {
        setSelected(item);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (collectionName: string, docId: string, docName: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, collectionName, docId);
        try {
            await deleteDoc(docRef);
            toast({ title: `${docName} Deleted`, description: `The ${docName.toLowerCase()} has been removed.` });
        } catch (error) {
            console.error(`Error deleting ${docName}:`, error);
            toast({ variant: 'destructive', title: 'Error', description: `Could not delete the ${docName.toLowerCase()}.` });
        }
    };

    const onSeedDatabase = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available.' });
            return;
        }
        setIsSeeding(true);
        const result = await seedDatabase(firestore);
        if (result.success) {
            toast({ title: 'Database Seeded', description: 'Your database has been populated with initial data.' });
        } else {
            toast({ variant: 'destructive', title: 'Seeding Failed', description: result.message });
        }
        setIsSeeding(false);
    }
    
    return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</TabsTrigger>
        <TabsTrigger value="content"><FilePen className="mr-2 h-4 w-4" />Content</TabsTrigger>
        <TabsTrigger value="tools"><Cog className="mr-2 h-4 w-4" />Tools</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="space-y-8 mt-6">
        <WithdrawalQueue />
        <FulfillmentQueue />
        <AffiliateApprovalList />
      </TabsContent>
      <TabsContent value="content" className="space-y-8 mt-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
            <div className="space-y-8">
                <AddGameForm selectedGame={selectedGame} onClearSelection={() => setSelectedGame(null)} />
                <AddRewardForm selectedReward={selectedReward} onClearSelection={() => setSelectedReward(null)} />
                <AddIAPForm selectedPack={selectedIap} onClearSelection={() => setSelectedIap(null)} />
                <AddAffiliateForm selectedOffer={selectedAffiliate} onClearSelection={() => setSelectedAffiliate(null)} />
                <AddStickerPackForm selectedPack={selectedStickerPack} onClearSelection={() => setSelectedStickerPack(null)} />
            </div>
             <div className="space-y-8">
                <GameList games={games} isLoading={gamesLoading} onEdit={(game) => handleEdit(game, setSelectedGame)} onDelete={(id) => handleDelete('games', id, 'Game')} />
                <RewardList rewards={rewards} isLoading={rewardsLoading} onEdit={(reward) => handleEdit(reward, setSelectedReward)} onDelete={(id) => handleDelete('rewards', id, 'Reward')} />
                <IAPList packs={iaps} isLoading={iapsLoading} onEdit={(pack) => handleEdit(pack, setSelectedIap)} onDelete={(id) => handleDelete('inAppPurchases', id, 'In-App Purchase')} />
                <AffiliateList offers={affiliates} isLoading={affiliatesLoading} onEdit={(offer) => handleEdit(offer, setSelectedAffiliate)} onDelete={(id) => handleDelete('affiliateOffers', id, 'Affiliate Offer')} />
                <StickerPackList packs={stickerPacks} isLoading={stickerPacksLoading} onEdit={(pack) => handleEdit(pack, setSelectedStickerPack)} onDelete={(id) => handleDelete('stickerPacks', id, 'Sticker Pack')} />
            </div>
        </div>
      </TabsContent>
      <TabsContent value="tools" className="mt-6">
        <Card>
            <CardHeader>
                <CardTitle>Database Tools</CardTitle>
            </CardHeader>
            <CardContent>
                <Button onClick={onSeedDatabase} disabled={isSeeding}>
                    <Database className="mr-2 h-4 w-4" />
                    {isSeeding ? 'Seeding...' : 'Seed Database'}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                    Populate your database with initial affiliate offers.
                </p>
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
