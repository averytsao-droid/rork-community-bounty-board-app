import { useState, useEffect, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Notification, Review } from '../types';
import { getFirebaseAuth, getFirebaseFirestore } from '../lib/firebaseClient';
import {
  User as FirebaseAuthUser,
  Unsubscribe,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateAuthProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const STORAGE_KEY = '@auth_user';
const NOTIFICATIONS_KEY = '@notifications';

type ServerTimestampValue = ReturnType<typeof serverTimestamp>;

interface FirestoreUserDocument {
  name?: string;
  avatar?: string;
  bio?: string;
  bountiesPosted?: number;
  bountiesCompleted?: number;
  totalEarned?: number;
  rating?: number;
  joinedAt?: Timestamp | string | Date | ServerTimestampValue;
  credits?: number;
  accountNumber?: number;
  followers?: string[];
  following?: string[];
  reviews?: unknown;
}

const buildAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

const parseDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
};

const parseStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
};

const parseReviews = (value: unknown): Review[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as Record<string, unknown>;
      if (
        typeof record.id !== 'string' ||
        typeof record.bountyId !== 'string' ||
        typeof record.reviewerId !== 'string' ||
        typeof record.reviewerName !== 'string' ||
        typeof record.reviewerAvatar !== 'string' ||
        typeof record.revieweeId !== 'string' ||
        typeof record.revieweeName !== 'string' ||
        typeof record.comment !== 'string' ||
        (record.role !== 'hunter' && record.role !== 'poster')
      ) {
        return null;
      }
      const ratingValue = Number(record.rating);
      if (Number.isNaN(ratingValue)) {
        return null;
      }
      return {
        id: record.id,
        bountyId: record.bountyId,
        reviewerId: record.reviewerId,
        reviewerName: record.reviewerName,
        reviewerAvatar: record.reviewerAvatar,
        revieweeId: record.revieweeId,
        revieweeName: record.revieweeName,
        rating: ratingValue,
        comment: record.comment,
        createdAt: parseDate(record.createdAt),
        role: record.role,
      };
    })
    .filter((item): item is Review => item !== null);
};

const mapFirestoreUser = (uid: string, data: FirestoreUserDocument): User => {
  const name = data.name ?? 'New User';
  const avatar = data.avatar ?? buildAvatar(name);
  return {
    id: uid,
    name,
    avatar,
    bio: data.bio ?? '',
    bountiesPosted: data.bountiesPosted ?? 0,
    bountiesCompleted: data.bountiesCompleted ?? 0,
    totalEarned: data.totalEarned ?? 0,
    rating: data.rating ?? 0,
    joinedDate: parseDate(data.joinedAt),
    credits: data.credits ?? 0,
    reviews: parseReviews(data.reviews),
    followers: parseStringArray(data.followers),
    following: parseStringArray(data.following),
    accountNumber: data.accountNumber,
  };
};

const notificationsStorageKey = (userId: string) => `${NOTIFICATIONS_KEY}_${userId}`;

const serializeUser = (user: User) => JSON.stringify({
  ...user,
  joinedDate: user.joinedDate.toISOString(),
});

const deserializeUser = (value: string): User | null => {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (typeof parsed.id !== 'string' || typeof parsed.name !== 'string') {
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name,
      avatar: typeof parsed.avatar === 'string' ? parsed.avatar : buildAvatar(parsed.name),
      bio: typeof parsed.bio === 'string' ? parsed.bio : '',
      bountiesPosted: Number(parsed.bountiesPosted) || 0,
      bountiesCompleted: Number(parsed.bountiesCompleted) || 0,
      totalEarned: Number(parsed.totalEarned) || 0,
      rating: Number(parsed.rating) || 0,
      joinedDate: parseDate(parsed.joinedDate),
      credits: Number(parsed.credits) || 0,
      reviews: parseReviews(parsed.reviews),
      followers: parseStringArray(parsed.followers),
      following: parseStringArray(parsed.following),
      accountNumber: typeof parsed.accountNumber === 'number' ? parsed.accountNumber : undefined,
    };
  } catch (error) {
    console.error('Failed to deserialize user cache', error);
    return null;
  }
};

const hydrateNotificationDates = (items: Notification[]): Notification[] =>
  items.map((item) => ({
    ...item,
    createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
  }));

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [authRetryToken, setAuthRetryToken] = useState(0);

  const ensureUserDocument = useCallback(async (firebaseUser: FirebaseAuthUser): Promise<User> => {
    const db = getFirebaseFirestore();
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as FirestoreUserDocument;
      const mappedUser = mapFirestoreUser(firebaseUser.uid, data);
      console.log('Loaded user profile', firebaseUser.uid);
      return mappedUser;
    }
    const baseName = firebaseUser.displayName ?? (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'New User');
    const userDoc: FirestoreUserDocument = {
      name: baseName,
      avatar: firebaseUser.photoURL ?? buildAvatar(baseName),
      bio: '',
      bountiesPosted: 0,
      bountiesCompleted: 0,
      totalEarned: 0,
      rating: 0,
      joinedAt: serverTimestamp(),
      credits: 2,
      accountNumber: Math.floor(Date.now() / 1000),
      followers: [],
      following: [],
      reviews: [],
    };
    await setDoc(userRef, userDoc);
    console.log('Created user profile', firebaseUser.uid);
    const createdSnapshot = await getDoc(userRef);
    const createdData = createdSnapshot.data() as FirestoreUserDocument | undefined;
    return mapFirestoreUser(firebaseUser.uid, createdData ?? { ...userDoc, joinedAt: new Date() });
  }, []);

  const loadNotificationsForUser = useCallback(async (userId: string) => {
    try {
      const stored = await AsyncStorage.getItem(notificationsStorageKey(userId));
      if (!stored) {
        setNotifications([]);
        return;
      }
      const parsed = JSON.parse(stored) as Notification[];
      setNotifications(hydrateNotificationDates(parsed));
      console.log('Loaded notifications', parsed.length);
    } catch (error) {
      console.error('Error loading notifications', error);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    const hydrateCachedUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          const parsedUser = deserializeUser(storedUser);
          if (parsedUser) {
            setUser(parsedUser);
            console.log('Hydrated cached user', parsedUser.id);
          }
        }
      } catch (error) {
        console.error('Failed to hydrate cached user', error);
      }
    };
    hydrateCachedUser();
  }, []);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const initializeAuthListener = () => {
      try {
        const authInstance = getFirebaseAuth();
        unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
          setIsLoading(true);
          setInitializationError(null);
          try {
            if (firebaseUser) {
              const mappedUser = await ensureUserDocument(firebaseUser);
              setUser(mappedUser);
              await AsyncStorage.setItem(STORAGE_KEY, serializeUser(mappedUser));
              await loadNotificationsForUser(firebaseUser.uid);
            } else {
              setUser(null);
              setNotifications([]);
              await AsyncStorage.removeItem(STORAGE_KEY);
            }
          } catch (error) {
            console.error('Auth state handling error', error);
            setUser(null);
            setNotifications([]);
            setInitializationError('Unable to connect to the authentication service. Please check your network or Firebase configuration.');
          } finally {
            setIsLoading(false);
            setIsInitialized(true);
          }
        });
      } catch (error) {
        console.error('Failed to initialize Firebase auth listener', error);
        setInitializationError('Authentication is currently unavailable. Please verify your Firebase setup.');
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuthListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [ensureUserDocument, loadNotificationsForUser, authRetryToken]);

  useEffect(() => {
    if (user?.id) {
      loadNotificationsForUser(user.id);
    }
  }, [user?.id, loadNotificationsForUser]);

  const retryInitialization = useCallback(() => {
    setInitializationError(null);
    setAuthRetryToken((prev) => prev + 1);
  }, []);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    if (!user) {
      return;
    }
    const key = notificationsStorageKey(user.id);
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false,
    };
    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));
    console.log('Notification added', newNotification.id);
  }, [notifications, user]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!user) {
      return;
    }
    const key = notificationsStorageKey(user.id);
    const updatedNotifications = notifications.map((item) =>
      item.id === notificationId ? { ...item, read: true } : item
    );
    setNotifications(updatedNotifications);
    await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));
    console.log('Notification marked as read', notificationId);
  }, [notifications, user]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      console.log('Firebase login success', email);
      return true;
    } catch (error) {
      console.error('Firebase login failed', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      setUser(null);
      setNotifications([]);
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('Firebase logout success');
    } catch (error) {
      console.error('Firebase logout failed', error);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, bio: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateAuthProfile(credential.user, {
        displayName: name,
      });
      const userDoc: FirestoreUserDocument = {
        name,
        avatar: buildAvatar(name),
        bio,
        bountiesPosted: 0,
        bountiesCompleted: 0,
        totalEarned: 0,
        rating: 0,
        joinedAt: serverTimestamp(),
        credits: 2,
        accountNumber: Math.floor(Date.now() / 1000),
        followers: [],
        following: [],
        reviews: [],
      };
      const db = getFirebaseFirestore();
      await setDoc(doc(db, 'users', credential.user.uid), userDoc, { merge: true });
      await ensureUserDocument(credential.user);
      console.log('Firebase registration success', credential.user.uid);
      return { success: true };
    } catch (error) {
      console.error('Firebase registration failed', error);
      return { success: false, error: 'Registration failed' };
    }
  }, [ensureUserDocument]);

  const updateProfile = useCallback(async (updates: { name?: string; bio?: string; avatar?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    try {
      const db = getFirebaseFirestore();
      const payload: Record<string, unknown> = {};
      if (updates.name) {
        payload.name = updates.name;
      }
      if (updates.bio !== undefined) {
        payload.bio = updates.bio;
      }
      if (updates.avatar) {
        payload.avatar = updates.avatar;
      }
      if (Object.keys(payload).length > 0) {
        await updateDoc(doc(db, 'users', user.id), payload);
      }
      if (updates.name || updates.avatar) {
        const auth = getFirebaseAuth();
        if (auth.currentUser) {
          await updateAuthProfile(auth.currentUser, {
            displayName: updates.name ?? auth.currentUser.displayName ?? undefined,
            photoURL: updates.avatar ?? auth.currentUser.photoURL ?? undefined,
          });
        }
      }
      const refreshedSnapshot = await getDoc(doc(db, 'users', user.id));
      const refreshedData = refreshedSnapshot.data() as FirestoreUserDocument | undefined;
      const updatedUser = mapFirestoreUser(user.id, refreshedData ?? user);
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEY, serializeUser(updatedUser));
      console.log('Profile updated', user.id);
      return { success: true };
    } catch (error) {
      console.error('Profile update failed', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }, [user]);

  const followUser = useCallback(async (targetUserId: string) => {
    if (!user || user.following?.includes(targetUserId)) {
      return;
    }
    try {
      const db = getFirebaseFirestore();
      await updateDoc(doc(db, 'users', user.id), {
        following: arrayUnion(targetUserId),
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        followers: arrayUnion(user.id),
      });
      const updatedUser: User = {
        ...user,
        following: [...(user.following ?? []), targetUserId],
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEY, serializeUser(updatedUser));
      console.log('User followed', targetUserId);
    } catch (error) {
      console.error('Follow user failed', error);
    }
  }, [user]);

  const unfollowUser = useCallback(async (targetUserId: string) => {
    if (!user || !(user.following ?? []).includes(targetUserId)) {
      return;
    }
    try {
      const db = getFirebaseFirestore();
      await updateDoc(doc(db, 'users', user.id), {
        following: arrayRemove(targetUserId),
      });
      await updateDoc(doc(db, 'users', targetUserId), {
        followers: arrayRemove(user.id),
      });
      const updatedUser: User = {
        ...user,
        following: (user.following ?? []).filter((id) => id !== targetUserId),
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEY, serializeUser(updatedUser));
      console.log('User unfollowed', targetUserId);
    } catch (error) {
      console.error('Unfollow user failed', error);
    }
  }, [user]);

  const getUserById = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await getDoc(doc(db, 'users', userId));
      if (!snapshot.exists()) {
        return null;
      }
      return mapFirestoreUser(userId, snapshot.data() as FirestoreUserDocument);
    } catch (error) {
      console.error('Get user by id failed', error);
      return null;
    }
  }, []);

  return useMemo(
    () => ({
      user,
      isLoading,
      isInitialized,
      isAuthenticated: !!user,
      notifications,
      login,
      logout,
      register,
      updateProfile,
      followUser,
      unfollowUser,
      getUserById,
      addNotification,
      markNotificationAsRead,
      initializationError,
      retryInitialization,
    }),
    [
      user,
      isLoading,
      isInitialized,
      notifications,
      login,
      logout,
      register,
      updateProfile,
      followUser,
      unfollowUser,
      getUserById,
      addNotification,
      markNotificationAsRead,
      initializationError,
      retryInitialization,
    ]
  );
});
