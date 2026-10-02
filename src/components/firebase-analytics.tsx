'use client';

import { useEffect } from 'react';
import { getFirebaseApp, initializeFirebaseAnalytics } from '@/lib/firebase';

export function FirebaseAnalytics() {
  useEffect(() => {
    getFirebaseApp();
    void initializeFirebaseAnalytics().catch(() => {
      console.warn('Firebase Analytics could not be initialized in this browser.');
    });
  }, []);

  return null;
}
