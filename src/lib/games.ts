import type { Game } from './data';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';


export function useGames() {
  const { firestore } = useFirebase();
  const gamesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'games') : null),
    [firestore]
  );
  return useCollection<Game>(gamesQuery);
}

export function useGameById(id: string | undefined) {
    const { firestore } = useFirebase();
    const gameRef = useMemoFirebase(
        () => (firestore && id ? doc(firestore, 'games', id) : null),
        [firestore, id]
    );
    return useDoc<Game>(gameRef);
}

    