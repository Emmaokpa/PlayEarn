
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This function ensures that Firebase is initialized only once.
function initializeFirebaseServices() {
  if (getApps().length) {
    // If an app is already initialized, get the existing instance.
    const app = getApp();
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  } else {
    // If no app is initialized, create the main app instance.
    const app = initializeApp(firebaseConfig);
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  }
}

// Export a function that returns the initialized services.
export function initializeFirebase() {
  return initializeFirebaseServices();
}

// --- Export the rest of the hooks and utilities as before ---

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
