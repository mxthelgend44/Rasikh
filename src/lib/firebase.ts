import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import type { Analytics } from 'firebase/analytics';

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyCrMEAkoBYVQqq2Y8sFbvIc_5rhmUhiMC8',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'rasikh-f0207.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'rasikh-f0207',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'rasikh-f0207.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '358470557716',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:358470557716:web:bc058ee1ccad24ae874701',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-7HJQLLQEL8',
};

export function getFirebaseApp(): FirebaseApp {
  return getApps().find((app) => app.name === '[DEFAULT]') ?? initializeApp(firebaseConfig);
}

let analyticsPromise: Promise<Analytics | null> | undefined;

export async function initializeFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;

  analyticsPromise ??= import('firebase/analytics')
    .then(async ({ getAnalytics, isSupported }) => {
      if (!(await isSupported())) return null;
      return getAnalytics(getFirebaseApp());
    })
    .catch((error: unknown) => {
      analyticsPromise = undefined;
      throw error;
    });

  return analyticsPromise;
}
