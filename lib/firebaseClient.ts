import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const getEnvVar = (key: string) => {
  return process.env[key] || Constants.expoConfig?.extra?.[key] || '';
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initError: Error | null = null;

export const initializeFirebase = () => {
  if (initError) {
    throw initError;
  }

  if (app && auth && db) {
    return { app, auth, db };
  }

  try {
    const firebaseConfig = {
      apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
      authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
      storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
    };

    console.log('🔧 Firebase Config Check:');
    console.log('  API Key:', firebaseConfig.apiKey ? '✓ Set' : '❌ MISSING');
    console.log('  Auth Domain:', firebaseConfig.authDomain ? '✓ Set' : '❌ MISSING');
    console.log('  Project ID:', firebaseConfig.projectId ? '✓ Set' : '❌ MISSING');
    console.log('  Storage Bucket:', firebaseConfig.storageBucket ? '✓ Set' : '❌ MISSING');
    console.log('  Messaging Sender ID:', firebaseConfig.messagingSenderId ? '✓ Set' : '❌ MISSING');
    console.log('  App ID:', firebaseConfig.appId ? '✓ Set' : '❌ MISSING');

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
      throw new Error('Missing required Firebase configuration');
    }

    if (getApps().length === 0) {
      console.log('🔥 Initializing Firebase...');
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('✅ Firebase initialized successfully');
    } else {
      app = getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('✅ Firebase already initialized');
    }
    return { app, auth, db };
  } catch (error: any) {
    console.error('❌ Firebase initialization failed:', error);
    initError = error;
    throw error;
  }
};

export const getFirebaseAuth = () => {
  if (!auth) {
    const initialized = initializeFirebase();
    return initialized.auth;
  }
  return auth;
};

export const getFirebaseFirestore = () => {
  if (!db) {
    const initialized = initializeFirebase();
    return initialized.db;
  }
  return db;
};
