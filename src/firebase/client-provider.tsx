'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    const { auth, firestore } = firebaseServices;

    const signIn = async () => {
      // Attempt to sign in anonymously
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // After signing in, check if a user profile exists in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // If the user document doesn't exist, create it with default values
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          name: `User ${user.uid.substring(0, 5)}`,
          avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
          coins: 100, // Starting coins
          referralCode: `${user.uid.substring(0, 6).toUpperCase()}`,
          isVip: false,
        });
      }
    };

    // We only want to attempt sign-in if there's no current user.
    if (!auth.currentUser) {
      signIn().catch(console.error);
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
