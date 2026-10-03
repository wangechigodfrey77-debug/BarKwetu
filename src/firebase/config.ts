import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  Firestore,
  setLogLevel,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

// Suppress transient network warning logs from Firestore client
try {
  setLogLevel('error');
} catch {
  // ignore
}

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Force Long Polling for 100% reliable connection in iframe/proxy environments
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    firebaseConfigData.firestoreDatabaseId || undefined
  );
} catch (e) {
  try {
    firestoreInstance = initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache(),
      },
      firebaseConfigData.firestoreDatabaseId || undefined
    );
  } catch {
    firestoreInstance = firebaseConfigData.firestoreDatabaseId
      ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const db = firestoreInstance;

// Initialize Firebase Auth
export const auth = getAuth(app);

