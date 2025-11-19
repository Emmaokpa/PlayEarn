'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// This function calls our secure API route to get a custom token
async function getCustomToken(initData: string): Promise<string> {
  const res = await fetch('/api/auth/telegram', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initData }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to get custom token. Status: ${res.status}. Message: ${errorText}`
    );
  }

  const { token } = await res.json();
  return token;
}

export function FirebaseClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    const { auth, firestore } = firebaseServices;

    // This effect should only run once, and only if there's no current user.
    if (auth.currentUser) {
      return;
    }

    const signInWithTelegram = async () => {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;

      if (!tg?.initData) {
        console.error(
          'Telegram web app data not found. App must be run inside Telegram.'
        );
        // Here you might want to display an error to the user,
        // or attempt a different sign-in method like anonymous.
        return;
      }

      try {
        // 1. Get the secure custom token from our API route
        const token = await getCustomToken(tg.initData);

        // 2. Sign in with the custom token
        const userCredential = await signInWithCustomToken(auth, token);
        const user = userCredential.user;

        // 3. Check if user profile exists, if not, create it.
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const tgUser = tg.initDataUnsafe.user;
          await setDoc(userDocRef, {
            id: user.uid,
            telegramId: user.uid,
            name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
            username: tgUser.username,
            avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`, // Placeholder
            coins: 100,
            referralCode: `${user.uid.substring(0, 6).toUpperCase()}`,
            isVip: false,
            registrationDate: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error('Failed to sign in with Telegram:', error);
        // Handle login failure (e.g., show error message)
      }
    };

    signInWithTelegram();
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
