
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
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import type { Game, UserProfile, Reward } from '@/lib/data';
import { doc, addDoc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Trash2, Edit, List, Database } from 'lucide-react';
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
    isVipOnly: z.boolean().default(false),
    imageUrl: z.string().url({ message: 'An image URL is required.' }).min(1, { message: 'Please upload an image.' }),
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
        defaultValues: { name: '', description: '', coins: 100, isVipOnly: false, imageUrl: '' },
    });

    useEffect(() => {
        form.reset(selectedReward || { name: '', description: '', coins: 100, isVipOnly: false, imageUrl: '' });
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
            form.reset({ name: '', description: '', coins: 100, isVipOnly: false, imageUrl: '' });
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

function AddAffiliateOfferForm() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof affiliateFormSchema>>({
    resolver: zodResolver(affiliateFormSchema),
    defaultValues: { title: '', description: '', link: '', imageUrl: '', rewardCoins: 1000 },
  });

  async function onSubmit(values: z.infer<typeof affiliateFormSchema>) {
    if (!firestore) return;
    try {
      const imageHint = values.title.split(' ').slice(0, 2).join(' ');
      const newOfferRef = doc(collection(firestore, 'affiliateOffers'));
      await setDoc(newOfferRef, { 
        ...values,
        id: newOfferRef.id,
        imageHint
      });
      toast({ title: 'Affiliate Offer Added!', description: `The "${values.title}" offer is now live.` });
      form.reset();
    } catch (error) {
      console.error('Error adding offer: ', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add the offer.' });
    }
  }

    return (
       <Card>
          <CardHeader>
            <CardTitle>Add New Affiliate Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Offer Title</FormLabel><FormControl><Input placeholder="e.g. BC.Game Sign Up" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Sign up for this awesome service and get..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="link" render={({ field }) => ( <FormItem><FormLabel>Affiliate Link</FormLabel><FormControl><Input placeholder="https://example.com/aff_id=123" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="rewardCoins" render={({ field }) => ( <FormItem><FormLabel>Coin Reward</FormLabel><FormControl><Input type="number" placeholder="1000" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>Offer Image</FormLabel><FormControl><ImageUpload onUpload={(url) => form.setValue('imageUrl', url, { shouldValidate: true })} initialImageUrl={field.value} /></FormControl><FormMessage /></FormItem> )}/>
                <Button type="submit" disabled={form.formState.isSubmitting}> {form.formState.isSubmitting ? 'Adding Offer...' : 'Add Offer'} </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}

function AddStickerPackForm() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof stickerPackFormSchema>>({
    resolver: zodResolver(stickerPackFormSchema),
    defaultValues: { name: '', description: '', price: 100, imageUrl: '' },
  });

  async function onSubmit(values: z.infer<typeof stickerPackFormSchema>) {
    if (!firestore) return;
    try {
      const imageHint = values.name.split(' ').slice(0, 2).join(' ');
      const newPackRef = doc(collection(firestore, 'stickerPacks'));
      await setDoc(newPackRef, { 
        ...values,
        id: newPackRef.id,
        imageHint
      });
      toast({ title: 'Sticker Pack Added!', description: `The "${values.name}" pack is now available in the store.` });
      form.reset();
    } catch (error) {
      console.error('Error adding sticker pack: ', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add the sticker pack.' });
    }
  }

  return (
    <Card>
        <CardHeader><CardTitle>Add New Sticker Pack</CardTitle></CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Pack Name</FormLabel><FormControl><Input placeholder="e.g. Cool Cats" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="A collection of cool cat stickers." {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Price (in Coins)</FormLabel><FormControl><Input type="number" placeholder="500" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>Pack Image</FormLabel><FormControl><ImageUpload onUpload={(url) => form.setValue('imageUrl', url, { shouldValidate: true })} initialImageUrl={field.value} /></FormControl><FormMessage /></FormItem> )}/>
                <Button type="submit" disabled={form.formState.isSubmitting}> {form.formState.isSubmitting ? 'Adding Pack...' : 'Add Sticker Pack'} </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}


function AdminDashboard() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);

    const gamesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'games') : null), [firestore]);
    const { data: games, isLoading: gamesLoading } = useCollection<Game>(gamesQuery);

    const rewardsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'rewards') : null), [firestore]);
    const { data: rewards, isLoading: rewardsLoading } = useCollection<Reward>(rewardsQuery);

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
        setIsSeeding(true);
        const result = await seedDatabase();
        if (result.success) {
            toast({ title: 'Database Seeded', description: 'Your database has been populated with initial data.' });
        } else {
            toast({ variant: 'destructive', title: 'Seeding Failed', description: result.message });
        }
        setIsSeeding(false);
    }
    
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
        <div className="space-y-8 lg:col-span-1">
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
                        Populate your database with initial games, rewards, etc.
                    </p>
                </CardContent>
            </Card>
            <AddGameForm selectedGame={selectedGame} onClearSelection={() => setSelectedGame(null)} />
            <AddRewardForm selectedReward={selectedReward} onClearSelection={() => setSelectedReward(null)} />
        </div>
        <div className="space-y-8 lg:col-span-1">
            <GameList games={games} isLoading={gamesLoading} onEdit={(game) => handleEdit(game, setSelectedGame)} onDelete={(id) => handleDelete('games', id, 'Game')} />
            <RewardList rewards={rewards} isLoading={rewardsLoading} onEdit={(reward) => handleEdit(reward, setSelectedReward)} onDelete={(id) => handleDelete('rewards', id, 'Reward')} />
        </div>
        <div className="space-y-8 lg:col-span-1">
             <AddAffiliateOfferForm />
             <AddStickerPackForm />
        </div>
    </div>
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

    
