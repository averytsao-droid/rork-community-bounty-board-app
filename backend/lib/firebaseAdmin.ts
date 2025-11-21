import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

export const initializeFirebaseAdmin = () => {
  if (app) {
    return app;
  }

  try {
    if (admin.apps.length === 0) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (serviceAccount) {
        const serviceAccountJSON = JSON.parse(serviceAccount);
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountJSON),
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        });
      } else {
        app = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        });
      }
      
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      app = admin.apps[0] as admin.app.App;
      console.log('✅ Firebase Admin already initialized');
    }
    
    return app;
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
  }
};

export const getFirebaseAdmin = () => {
  if (!app) {
    return initializeFirebaseAdmin();
  }
  return app;
};

export const getAuth = () => {
  const adminApp = getFirebaseAdmin();
  return adminApp.auth();
};

export const getFirestore = () => {
  const adminApp = getFirebaseAdmin();
  return adminApp.firestore();
};
