import { useState, useEffect, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Notification, Review } from '../types';
import { currentUser as mockCurrentUser } from '../mocks/users';

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
            await loadNotificationsForUser(parsedUser.id);
            console.log('Hydrated cached user', parsedUser.id);
          }
        }
      } catch (error) {
        console.error('Failed to hydrate cached user', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    hydrateCachedUser();
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
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(mockCurrentUser);
      await AsyncStorage.setItem(STORAGE_KEY, serializeUser(mockCurrentUser));
      await loadNotificationsForUser(mockCurrentUser.id);
      console.log('Mock login success', email);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  }, [loadNotificationsForUser]);

  const logout = useCallback(async () => {
    try {
      setUser(null);
      setNotifications([]);
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('Logout success');
    } catch (error) {
      console.error('Logout failed', error);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, bio: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newUser: User = {
        ...mockCurrentUser,
        name,
        bio,
        avatar: buildAvatar(name),
        joinedDate: new Date(),
      };
      setUser(newUser);
      await AsyncStorage.setItem(STORAGE_KEY, serializeUser(newUser));
      await loadNotificationsForUser(newUser.id);
      console.log('Mock registration success', email);
      return { success: true };
    } catch (error) {
      console.error('Registration failed', error);
      return { success: false, error: 'Registration failed' };
    }
  }, [loadNotificationsForUser]);

  const updateProfile = useCallback(async (updates: { name?: string; bio?: string; avatar?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const updatedUser: User = {
        ...user,
        ...(updates.name && { name: updates.name }),
        ...(updates.bio !== undefined && { bio: updates.bio }),
        ...(updates.avatar && { avatar: updates.avatar }),
      };
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
      await new Promise(resolve => setTimeout(resolve, 200));
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
      await new Promise(resolve => setTimeout(resolve, 200));
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
      await new Promise(resolve => setTimeout(resolve, 100));
      if (userId === mockCurrentUser.id) {
        return mockCurrentUser;
      }
      return null;
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
