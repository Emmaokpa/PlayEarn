'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// This function would ideally be a Server Action that securely generates a token.
// For this prototype, we'll generate a placeholder token on the client.
// In a real app, this MUST be a secure backend call.
async function getCustomToken(uid: string): Promise<string> {
  // This is a placeholder. In a real app, you would make a fetch request
  // to a server action/API route that validates the Telegram data and
  // uses the Firebase Admin SDK to create a custom token.
  // For now, we are creating a mock token for demonstration.
  // This part of the code will need to be replaced with a real implementation.
  console.warn(
    'Using a mock custom token. This is not secure for production.'
  );

  // A very basic, insecure way to demonstrate the flow.
  // The UID is embedded in this "mock" token.
  return `mock-token-for-${uid}`;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    const { auth, firestore } = firebaseServices;

    const signInWithTelegram = async () => {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;

      if (!tg?.initDataUnsafe?.user) {
        console.error('Telegram user data not found. App must be run inside Telegram.');
        // In a real app, you might want to show a message to the user.
        return;
      }
      
      const tgUser = tg.initDataUnsafe.user;
      const uid = tgUser.id.toString();

      // In a real app, you'd call a server action here to get a *real* custom token.
      // For this prototype, we'll simulate it.
      // const token = await getCustomTokenFromServer(tg.initData);
      
      // Because we can't mint real tokens on the client, and to avoid setting up a
      // whole backend function for this prototype, we will adapt the sign-in logic.
      // We'll proceed as if we have a user, and manage the user document directly.
      // This is NOT standard Firebase auth, but allows us to prototype the UX.
      
      const userDocRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: uid,
          telegramId: uid,
          name: tgUser.username || `User ${uid.substring(0, 5)}`,
          username: tgUser.username,
          avatarUrl: `https://picsum.photos/seed/${uid}/100/100`,
          coins: 100,
          referralCode: `${uid.substring(0, 6).toUpperCase()}`,
          isVip: false,
          registrationDate: serverTimestamp(),
        });
      }
       // The actual sign-in is managed by onAuthStateChanged in the provider
       // which will now be simulated since we can't create a real custom token
       // on the client. For the prototype, we assume the user is "logged in"
       // by virtue of having their Telegram ID.
    };

    if (!auth.currentUser) {
      signInWithTelegram().catch(console.error);
    }
  }, [firebaseServices]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
