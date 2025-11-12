import { useState, useEffect, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Notification } from '@/types';

const STORAGE_KEY = '@auth_user';
const USERS_STORAGE_KEY = '@all_users';
const ACCOUNT_COUNTER_KEY = '@account_counter';
const NOTIFICATIONS_KEY = '@notifications';

const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Morgan',
    avatar: 'https://i.pravatar.cc/150?img=33',
    bio: 'Full-stack developer passionate about building great products.',
    bountiesPosted: 8,
    bountiesCompleted: 24,
    totalEarned: 12500,
    rating: 4.8,
    joinedDate: new Date('2024-03-15'),
    credits: 2,
    accountNumber: 1,
    followers: [],
    following: [],
    reviews: [],
  },
  {
    id: 'user-2',
    name: 'Sarah Chen',
    avatar: 'https://i.pravatar.cc/150?img=45',
    bio: 'Designer and developer at Dartmouth.',
    bountiesPosted: 5,
    bountiesCompleted: 18,
    totalEarned: 8900,
    rating: 4.9,
    joinedDate: new Date('2024-02-10'),
    credits: 2,
    accountNumber: 2,
    followers: [],
    following: [],
    reviews: [],
  },
  {
    id: 'user-3',
    name: 'Mike Johnson',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Always happy to help out around campus.',
    bountiesPosted: 12,
    bountiesCompleted: 31,
    totalEarned: 15200,
    rating: 4.7,
    joinedDate: new Date('2024-01-05'),
    credits: 2,
    accountNumber: 3,
    followers: [],
    following: [],
    reviews: [],
  },
];

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadUser();
    loadNotifications();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser({
          ...parsed,
          joinedDate: new Date(parsed.joinedDate),
          credits: parsed.credits ?? 1000,
          totalEarned: parsed.totalEarned ?? 0,
          bountiesPosted: parsed.bountiesPosted ?? 0,
          bountiesCompleted: parsed.bountiesCompleted ?? 0,
          rating: parsed.rating ?? 0,
          followers: parsed.followers ?? [],
          following: parsed.following ?? [],
          reviews: parsed.reviews ?? [],
          accountNumber: parsed.accountNumber,
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const loadNotifications = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        setNotifications(parsed.map((n: Notification) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        })));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false,
    };
    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
    console.log('Notification added:', newNotification);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const storedUsersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const allUsers = storedUsersData ? JSON.parse(storedUsersData) : [];
      
      const emailToUserId: { [key: string]: string } = {
        'alex@dartmouth.edu': 'user-1',
        'sarah@dartmouth.edu': 'user-2',
        'mike@dartmouth.edu': 'user-3',
      };

      const demoUserId = emailToUserId[email.toLowerCase()];
      if (demoUserId && password === 'password') {
        const selectedUser = mockUsers.find(u => u.id === demoUserId);
        if (selectedUser) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selectedUser));
          setUser(selectedUser);
          console.log('User logged in:', selectedUser.name);
          return true;
        }
      }

      const registeredUser = allUsers.find((u: any) => u.email === email.toLowerCase() && u.password === password);
      if (registeredUser) {
        const userToLogin = {
          id: registeredUser.id,
          name: registeredUser.name,
          avatar: registeredUser.avatar,
          bio: registeredUser.bio,
          bountiesPosted: registeredUser.bountiesPosted,
          bountiesCompleted: registeredUser.bountiesCompleted,
          totalEarned: registeredUser.totalEarned,
          rating: registeredUser.rating,
          joinedDate: new Date(registeredUser.joinedDate),
          credits: registeredUser.credits || 1000,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userToLogin));
        setUser(userToLogin);
        console.log('User logged in:', userToLogin.name);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    // Try to sign out from Firebase if configured
    try {
      const { logout: firebaseLogout } = await import('@/lib/firebase-auth');
      await firebaseLogout();
    } catch (error) {
      // Firebase not configured or not available, continue with local logout
      console.log('Firebase logout not available, using local logout only');
    }
    
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
    console.log('User logged out');
  };

  const register = async (name: string, email: string, password: string, bio: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedUsersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const allUsers = storedUsersData ? JSON.parse(storedUsersData) : [];

      const existingUser = allUsers.find((u: any) => u.email === email.toLowerCase());
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      const accountCounterStr = await AsyncStorage.getItem(ACCOUNT_COUNTER_KEY);
      const accountCounter = accountCounterStr ? parseInt(accountCounterStr, 10) : 3;
      const newAccountNumber = accountCounter + 1;

      const initialCredits = newAccountNumber <= 50 ? 7 : 2;

      const newUser = {
        id: `user-${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password,
        avatar: `https://i.pravatar.cc/150?u=${email}`,
        bio,
        bountiesPosted: 0,
        bountiesCompleted: 0,
        totalEarned: 0,
        rating: 0,
        joinedDate: new Date().toISOString(),
        credits: initialCredits,
        accountNumber: newAccountNumber,
        followers: [],
        following: [],
        reviews: [],
      };

      allUsers.push(newUser);
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
      await AsyncStorage.setItem(ACCOUNT_COUNTER_KEY, newAccountNumber.toString());

      const userToSet: User = {
        id: newUser.id,
        name: newUser.name,
        avatar: newUser.avatar,
        bio: newUser.bio,
        bountiesPosted: newUser.bountiesPosted,
        bountiesCompleted: newUser.bountiesCompleted,
        totalEarned: newUser.totalEarned,
        rating: newUser.rating,
        joinedDate: new Date(newUser.joinedDate),
        credits: newUser.credits,
        accountNumber: newUser.accountNumber,
        followers: newUser.followers,
        following: newUser.following,
        reviews: newUser.reviews,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userToSet));
      setUser(userToSet);
      console.log('User registered:', userToSet.name, 'Account #:', newAccountNumber, 'Credits:', initialCredits);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  };

  const updateProfile = async (updates: { name?: string; bio?: string; avatar?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      const updatedUser: User = {
        ...user,
        ...(updates.name && { name: updates.name }),
        ...(updates.bio !== undefined && { bio: updates.bio }),
        ...(updates.avatar && { avatar: updates.avatar }),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      
      const storedUsersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsersData) {
        const allUsers = JSON.parse(storedUsersData);
        const userIndex = allUsers.findIndex((u: any) => u.id === user.id);
        if (userIndex !== -1) {
          allUsers[userIndex] = {
            ...allUsers[userIndex],
            ...(updates.name && { name: updates.name }),
            ...(updates.bio !== undefined && { bio: updates.bio }),
            ...(updates.avatar && { avatar: updates.avatar }),
          };
          await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
        }
      }

      setUser(updatedUser);
      console.log('Profile updated:', updatedUser.name);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  const followUser = async (targetUserId: string) => {
    if (!user) return;
    
    const storedUsersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    const allUsers = storedUsersData ? JSON.parse(storedUsersData) : [];
    
    const updatedUser = {
      ...user,
      following: [...(user.following || []), targetUserId],
    };
    
    const userIndex = allUsers.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      allUsers[userIndex].following = updatedUser.following;
    }
    
    const targetUserIndex = allUsers.findIndex((u: any) => u.id === targetUserId);
    if (targetUserIndex !== -1) {
      allUsers[targetUserIndex].followers = [...(allUsers[targetUserIndex].followers || []), user.id];
    }
    
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    console.log('User followed:', targetUserId);
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return;
    
    const storedUsersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    const allUsers = storedUsersData ? JSON.parse(storedUsersData) : [];
    
    const updatedUser = {
      ...user,
      following: (user.following || []).filter(id => id !== targetUserId),
    };
    
    const userIndex = allUsers.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      allUsers[userIndex].following = updatedUser.following;
    }
    
    const targetUserIndex = allUsers.findIndex((u: any) => u.id === targetUserId);
    if (targetUserIndex !== -1) {
      allUsers[targetUserIndex].followers = (allUsers[targetUserIndex].followers || []).filter((id: string) => id !== user.id);
    }
    
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    console.log('User unfollowed:', targetUserId);
  };

  const getUserById = async (userId: string): Promise<User | null> => {
    try {
      const storedUsersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const allUsers = storedUsersData ? JSON.parse(storedUsersData) : [];
      const foundUser = allUsers.find((u: any) => u.id === userId);
      
      if (foundUser) {
        return {
          id: foundUser.id,
          name: foundUser.name,
          avatar: foundUser.avatar,
          bio: foundUser.bio,
          bountiesPosted: foundUser.bountiesPosted,
          bountiesCompleted: foundUser.bountiesCompleted,
          totalEarned: foundUser.totalEarned,
          rating: foundUser.rating,
          joinedDate: new Date(foundUser.joinedDate),
          credits: foundUser.credits,
          accountNumber: foundUser.accountNumber,
          followers: foundUser.followers || [],
          following: foundUser.following || [],
          reviews: foundUser.reviews || [],
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  };

  const loginCallback = useCallback(login, []);
  const logoutCallback = useCallback(logout, []);
  const registerCallback = useCallback(register, []);
  const updateProfileCallback = useCallback(updateProfile, [user]);
  const followUserCallback = useCallback(followUser, [user]);
  const unfollowUserCallback = useCallback(unfollowUser, [user]);
  const getUserByIdCallback = useCallback(getUserById, []);
  const addNotificationCallback = useCallback(addNotification, [notifications]);
  const markNotificationAsReadCallback = useCallback(markNotificationAsRead, [notifications]);

  return useMemo(() => ({
    user,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    notifications,
    login: loginCallback,
    logout: logoutCallback,
    register: registerCallback,
    updateProfile: updateProfileCallback,
    followUser: followUserCallback,
    unfollowUser: unfollowUserCallback,
    getUserById: getUserByIdCallback,
    addNotification: addNotificationCallback,
    markNotificationAsRead: markNotificationAsReadCallback,
  }), [user, isLoading, isInitialized, notifications, loginCallback, logoutCallback, registerCallback, updateProfileCallback, followUserCallback, unfollowUserCallback, getUserByIdCallback, addNotificationCallback, markNotificationAsReadCallback]);
});
