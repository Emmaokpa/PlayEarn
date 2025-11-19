
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

/**
 * The FirebaseClientProvider is responsible for initializing Firebase on the client-side
 * and wrapping the application with the core FirebaseProvider. This ensures that Firebase
 * services are available to all components that need them.
 */
export function FirebaseClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  // useMemo ensures that Firebase is only initialized once per application lifecycle.
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

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
