
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
import type { Game, UserProfile } from '@/lib/data';
import { doc, addDoc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
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

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Game name is required.',
  }),
  category: z.string().min(2, {
    message: 'Category is required.',
  }),
  iframeUrl: z.string().url({
    message: 'Please enter a valid iframe URL.',
  }),
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      iframeUrl: '',
    },
  });

  useEffect(() => {
    form.reset(selectedGame || { name: '', category: '', iframeUrl: '' });
  }, [selectedGame, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    try {
      const imageHint = values.name.split(' ').slice(0, 2).join(' ');
      const imageUrl = `https://picsum.photos/seed/${imageHint}/600/400`;
      
      if (selectedGame) {
        const gameRef = doc(firestore, 'games', selectedGame.id);
        await setDoc(gameRef, { ...values, imageUrl, imageHint }, { merge: true });
        toast({ title: 'Game Updated!', description: `"${values.name}" has been updated.` });
      } else {
        await addDoc(collection(firestore, 'games'), { ...values, imageUrl, imageHint });
        toast({ title: 'Game Added!', description: `"${values.name}" is now available to play.` });
      }
      form.reset({ name: '', category: '', iframeUrl: '' });
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

function GameList({ onEdit, onDelete }: { onEdit: (game: Game) => void; onDelete: (gameId: string) => void; }) {
  const { firestore } = useFirebase();
  const gamesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'games') : null),
    [firestore]
  );
  const { data: games, isLoading } = useCollection<Game>(gamesQuery);

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
        <CardHeader><CardTitle>Manage Games</CardTitle></CardHeader>
        <CardContent>
            <ul className="space-y-2">
                {games?.map((game) => (
                    <li key={game.id} className="flex items-center justify-between rounded-md border p-3">
                        <span className="font-semibold">{game.name}</span>
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
            </ul>
        </CardContent>
    </Card>
  )
}

function AdminDashboard() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);

    const handleEditGame = (game: Game) => {
        setSelectedGame(game);
    };

    const handleDeleteGame = async (gameId: string) => {
        if (!firestore) return;
        const gameRef = doc(firestore, 'games', gameId);
        try {
            await deleteDoc(gameRef);
            toast({ title: 'Game Deleted', description: 'The game has been removed.' });
        } catch (error) {
            console.error('Error deleting game: ', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the game.' });
        }
    };
    
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
      <AddGameForm selectedGame={selectedGame} onClearSelection={() => setSelectedGame(null)} />
      <GameList onEdit={handleEditGame} onDelete={handleDeleteGame} />
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
