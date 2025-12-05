
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// --- New Simplified Initialization Logic ---

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * A robust function to initialize Firebase, ensuring it only happens once.
 * It checks if an app is already initialized; if not, it creates one.
 * This is the standard and recommended way for client-side apps.
 */
function initializeFirebaseServices() {
  if (!getApps().length) {
    // No apps initialized yet, so create a new one.
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    // An app is already initialized, so get the existing one.
    firebaseApp = getApp();
  }
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
}

// Immediately initialize Firebase services when this module is loaded.
initializeFirebaseServices();

/**
 * A simple function to return the initialized Firebase services.
 * This replaces the previous complex logic.
 *
 * @returns An object containing the initialized Firebase services.
 */
export function initializeFirebase() {
  // The services are already initialized above, so we just return them.
  // This function signature is kept for compatibility with where it's called.
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
