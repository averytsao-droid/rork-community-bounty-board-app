import { useState, useEffect, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Notification, Review } from '../types';
import { getFirebaseAuth, getFirebaseFirestore } from '../lib/firebaseClient';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

const STORAGE_KEY = '@auth_user';
const NOTIFICATIONS_KEY = '@notifications';

const buildAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

const parseDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
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



const notificationsStorageKey = (userId: string) => `${NOTIFICATIONS_KEY}_${userId}`;

const serializeUser = (user: User) => JSON.stringify({
  ...user,
  joinedDate: user.joinedDate.toISOString(),
});



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
  const [, setAuthRetryToken] = useState(0);



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
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const appUser: User = {
              id: firebaseUser.uid,
              name: userData.name || '',
              avatar: userData.avatar || buildAvatar(userData.name || 'User'),
              bio: userData.bio || '',
              bountiesPosted: userData.bountiesPosted || 0,
              bountiesCompleted: userData.bountiesCompleted || 0,
              totalEarned: userData.totalEarned || 0,
              rating: userData.rating || 0,
              joinedDate: userData.joinedDate?.toDate() || new Date(),
              credits: userData.credits || 1000,
              reviews: userData.reviews || [],
              followers: userData.followers || [],
              following: userData.following || [],
              accountNumber: userData.accountNumber,
            };
            setUser(appUser);
            await AsyncStorage.setItem(STORAGE_KEY, serializeUser(appUser));
            await loadNotificationsForUser(appUser.id);
            console.log('Loaded Firebase user:', appUser.id);
          }
        } catch (error) {
          console.error('Error loading Firebase user:', error);
          setInitializationError('Failed to load user data');
        }
      } else {
        setUser(null);
        setNotifications([]);
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('No Firebase user');
      }
      
      setIsLoading(false);
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [loadNotificationsForUser]);





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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase login success:', userCredential.user.uid);
      return true;
    } catch (error: any) {
      console.error('Login failed:', error.message);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      console.log('Firebase logout success');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, bio: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseFirestore();
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      const newUser = {
        name,
        email,
        bio,
        avatar: buildAvatar(name),
        bountiesPosted: 0,
        bountiesCompleted: 0,
        totalEarned: 0,
        rating: 0,
        joinedDate: Timestamp.now(),
        credits: 1000,
        reviews: [],
        followers: [],
        following: [],
      };
      
      await setDoc(doc(db, 'users', userId), newUser);
      console.log('Firebase registration success:', userId);
      return { success: true };
    } catch (error: any) {
      console.error('Registration failed:', error.message);
      return { success: false, error: error.message || 'Registration failed' };
    }
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; bio?: string; avatar?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    try {
      const db = getFirebaseFirestore();
      const userRef = doc(db, 'users', user.id);
      
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.avatar) updateData.avatar = updates.avatar;
      
      await updateDoc(userRef, updateData);
      
      const updatedUser: User = {
        ...user,
        ...updateData,
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEY, serializeUser(updatedUser));
      console.log('Profile updated:', user.id);
      return { success: true };
    } catch (error: any) {
      console.error('Profile update failed:', error.message);
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  }, [user]);

  const followUser = useCallback(async (targetUserId: string) => {
    if (!user || user.following?.includes(targetUserId)) {
      return;
    }
    try {
      const db = getFirebaseFirestore();
      const userRef = doc(db, 'users', user.id);
      const targetRef = doc(db, 'users', targetUserId);
      
      const updatedFollowing = [...(user.following ?? []), targetUserId];
      await updateDoc(userRef, { following: updatedFollowing });
      
      const targetDoc = await getDoc(targetRef);
      if (targetDoc.exists()) {
        const targetData = targetDoc.data();
        const updatedFollowers = [...(targetData.followers || []), user.id];
        await updateDoc(targetRef, { followers: updatedFollowers });
      }
      
      const updatedUser: User = {
        ...user,
        following: updatedFollowing,
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEY, serializeUser(updatedUser));
      console.log('User followed:', targetUserId);
    } catch (error: any) {
      console.error('Follow user failed:', error.message);
    }
  }, [user]);

  const unfollowUser = useCallback(async (targetUserId: string) => {
    if (!user || !(user.following ?? []).includes(targetUserId)) {
      return;
    }
    try {
      const db = getFirebaseFirestore();
      const userRef = doc(db, 'users', user.id);
      const targetRef = doc(db, 'users', targetUserId);
      
      const updatedFollowing = (user.following ?? []).filter((id) => id !== targetUserId);
      await updateDoc(userRef, { following: updatedFollowing });
      
      const targetDoc = await getDoc(targetRef);
      if (targetDoc.exists()) {
        const targetData = targetDoc.data();
        const updatedFollowers = (targetData.followers || []).filter((id: string) => id !== user.id);
        await updateDoc(targetRef, { followers: updatedFollowers });
      }
      
      const updatedUser: User = {
        ...user,
        following: updatedFollowing,
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEY, serializeUser(updatedUser));
      console.log('User unfollowed:', targetUserId);
    } catch (error: any) {
      console.error('Unfollow user failed:', error.message);
    }
  }, [user]);

  const getUserById = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const db = getFirebaseFirestore();
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: userId,
          name: userData.name || '',
          avatar: userData.avatar || buildAvatar(userData.name || 'User'),
          bio: userData.bio || '',
          bountiesPosted: userData.bountiesPosted || 0,
          bountiesCompleted: userData.bountiesCompleted || 0,
          totalEarned: userData.totalEarned || 0,
          rating: userData.rating || 0,
          joinedDate: userData.joinedDate?.toDate() || new Date(),
          credits: userData.credits || 0,
          reviews: userData.reviews || [],
          followers: userData.followers || [],
          following: userData.following || [],
          accountNumber: userData.accountNumber,
        };
      }
      return null;
    } catch (error: any) {
      console.error('Get user by id failed:', error.message);
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
