'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// --- New Robust Initialization Logic ---

// A function that initializes Firebase and returns the services.
// It ensures that initialization only happens once by checking getApps().
const initializeFirebaseServices = () => {
  if (getApps().length === 0) {
    // If no app is initialized, create the main app instance.
    const firebaseApp = initializeApp(firebaseConfig);
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    return { firebaseApp, auth, firestore };
  } else {
    // If an app is already initialized, get the existing instance.
    const firebaseApp = getApp();
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    return { firebaseApp, auth, firestore };
  }
};

// Immediately initialize and store the services.
// This code runs once per client session.
const { firebaseApp, auth, firestore } = initializeFirebaseServices();

/**
 * A simple function to return the already initialized Firebase services.
 * This function's only job is to provide access to the services initialized above.
 *
 * @returns An object containing the initialized Firebase services.
 */
export function initializeFirebase() {
  return { firebaseApp, auth, firestore };
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
