import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API_BASE_URL from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
// Notifee for foreground local notifications
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import notifee, { AndroidImportance, AndroidColor } from '@notifee/react-native';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { analyticsService } from '../services/analytics';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'owner' | 'manager' | 'employee' | 'user';
  ownedCarwashes: string[];
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userData: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  clearStorage: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateUserRole: (role: User['role']) => Promise<void>;
  addToOwnedCarwashes: (carwashId: string) => Promise<void>;
  removeFromOwnedCarwashes: (carwashId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Track login history
  const trackLoginHistory = async (user: User) => {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        deviceName: Device.deviceName || null,
        modelName: Device.modelName || null,
        osVersion: Device.osVersion || null,
        appVersion: Constants.expoConfig?.version || null,
      };

      await fetch(`${API_BASE_URL}/login-history/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          phone: user.phone,
          email: user.email,
          firstName: user.name,
          deviceInfo,
        }),
      });
    } catch (error) {
      console.error('Error tracking login history:', error);
    }
  };

  // Device token registration function
  const registerDeviceToken = async (userId: string) => {
    try {
      
      const token = await messaging().getToken();
      console.log('📱 [USERCONTEXT] Firebase token received:', token ? '✅ Token exists' : '❌ No token');
      
      if (token) {
        console.log('📱 [USERCONTEXT] Registering device token for user:', userId);
        console.log('📱 [USERCONTEXT] Token:', token.substring(0, 50) + '...');
        console.log('📱 [USERCONTEXT] Platform:', Platform.OS);
        console.log('📱 [USERCONTEXT] API URL:', API_BASE_URL);
        console.log('📱 [USERCONTEXT] Sending to:', `${API_BASE_URL}/notifications/register-device`);
        
        // Collect device information
        const deviceInfo = {
          deviceName: Device.deviceName || null,
          modelName: Device.modelName || null,
          brand: Device.brand || null,
          manufacturer: Device.manufacturer || null,
          osName: Device.osName || null,
          osVersion: Device.osVersion || null,
          deviceType: Device.deviceType || null,
          totalMemory: Device.totalMemory || null,
          appVersion: Constants.expoConfig?.version || null,
          appBuildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || null,
          platform: Platform.OS,
          platformVersion: Platform.Version?.toString() || null,
        };
        
        
        const requestBody = {
          userId,
          token,
          platform: Platform.OS,
          deviceInfo,
        };
        console.log('📱 [USERCONTEXT] Request body:', {
          userId: requestBody.userId,
          tokenPreview: requestBody.token.substring(0, 50) + '...',
          platform: requestBody.platform,
          deviceInfo: requestBody.deviceInfo,
        });
        
        const response = await fetch(`${API_BASE_URL}/notifications/register-device`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        
        console.log('📱 [USERCONTEXT] Response status:', response.status);
        console.log('📱 [USERCONTEXT] Response ok:', response.ok);
        
        const result = await response.json();
        console.log('📱 [USERCONTEXT] Response body:', result);
        
        if (response.ok && result.success) {
          console.log('✅ [USERCONTEXT] Device token registered successfully in backend');
          console.log('✅ [USERCONTEXT] Registered userId:', userId);
          console.log('✅ [USERCONTEXT] Response:', result);
        } else {
          console.warn('⚠️ [USERCONTEXT] Device token registration returned:', result);
          console.warn('⚠️ [USERCONTEXT] Request was not successful');
        }
      } else {
        console.warn('⚠️ [USERCONTEXT] No Firebase token available to register');
      }
    } catch (error) {
      console.error('❌ [USERCONTEXT] Failed to register device token:', error);
      console.error('❌ [USERCONTEXT] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        userId: userId,
      });
      if (error instanceof Error) {
        console.error('❌ [USERCONTEXT] Error message:', error.message);
        console.error('❌ [USERCONTEXT] Error stack:', error.stack);
      }
    }
  };

  // მონაცემების ჩატვირთვა AsyncStorage-დან
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    let unsubscribeOnMessage: (() => void) | undefined;
    let unsubscribeOnNotificationOpened: (() => void) | undefined;
    const handleNavigateFromData = (data?: Record<string, any>) => {
      if (!data) return;
      // Prefer explicit screen param
      const screen = data.screen as string | undefined;
      if (screen) {
        // Map known screens to routes if necessary
        if (screen === 'AIRecommendations' && data.requestId) {
          router.push('/offers');
          return;
        }
        if (screen === 'PartDetails' && data.partId) {
          router.push('/offers');
          return;
        }
        if (screen === 'RequestDetails' && data.requestId) {
          router.push(`/offers/${data.requestId}`);
          return;
        }
      }
      const type = data.type as string | undefined;
      if (type === 'chat_message' && data.offerId) {
        router.push(`/chat/${data.offerId}`);
        return;
      }
      if (type === 'carwash_booking') {
        const cwId = (data as any).carwashId;
        if (cwId) {
          router.push(`/bookings/${cwId}`);
        } else {
          router.push('/bookings');
        }
        return;
      }
      if (type === 'new_request') {
        router.push('/offers');
        return;
      }
      if (type === 'new_offer') {
        router.push('/offers');
        return;
      }
      if (type?.startsWith('ai_')) {
        router.push('/offers');
        return;
      }
      router.push('/notifications');
    };
    (async () => {
      try {
        // iOS permissions
        if (Platform.OS === 'ios') {
          await notifee.requestPermission();
        }

        // Android channel
        let channelId: string | undefined;
        if (Platform.OS === 'android') {
          channelId = await notifee.createChannel({
            id: 'default',
            name: 'Default',
            lights: true,
            vibration: true,
            importance: AndroidImportance.HIGH,
            badge: true,
            sound: 'default',
            lightColor: AndroidColor.RED,
          });
        }

        // Foreground messages → show local notification via Notifee
        unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
          try {
            const title = remoteMessage.notification?.title || 'შეტყობინება';
            const body = remoteMessage.notification?.body || '';
            await notifee.displayNotification({
              title,
              body,
              data: remoteMessage.data || {},
              android: {
                channelId: channelId || 'default',
                smallIcon: 'ic_notification',
                pressAction: { id: 'default' },
              },
              ios: {
                sound: 'default',
                foregroundPresentationOptions: {
                  banner: true,
                  sound: true,
                  badge: true,
                },
              },
            });
          } catch (e) {
            console.log('[NOTIFEE] displayNotification error', e);
          }
        });

        // Handle tap when app is in background (system notification)
        unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp(
          remoteMessage => {
            try {
              handleNavigateFromData(remoteMessage?.data as any);
            } catch {}
          },
        );

        // Handle cold start (user tapped notification to open the app)
        const initial = await messaging().getInitialNotification();
        if (initial?.data) {
          handleNavigateFromData(initial.data as any);
        }

        // Handle Notifee foreground press events
        notifee.onForegroundEvent(({ type, detail }) => {
          if (type === 1 /* EventType.PRESS */) {
            handleNavigateFromData(detail.notification?.data as any);
          }
        });
      } catch (e) {
        console.log('[NOTIFEE] setup error', e);
      }
    })();

    return () => {
      try {
        if (unsubscribeOnMessage) unsubscribeOnMessage();
        if (unsubscribeOnNotificationOpened) unsubscribeOnNotificationOpened();
      } catch (e) {}
    };
  }, []);

  // Auto-register device token and track login when user is loaded
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 [USERCONTEXT] useEffect triggered, user.id:', user.id);
      console.log('🔄 [USERCONTEXT] User object:', {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      });
      registerDeviceToken(user.id);
      // Track app open/login history (async, don't wait for it)
      trackLoginHistory(user).catch((err) => {
        console.error('Error tracking login history on app open:', err);
      });
    } else {
      console.log('⚠️ [USERCONTEXT] useEffect triggered but user.id is missing');
    }
  }, [user?.id]);

  const loadUserFromStorage = async () => {
    try {
      console.log('🔍 [USERCONTEXT] Loading user from storage...');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        // Ensure ownedCarwashes is always an array
        if (!parsedUser.ownedCarwashes) {
          parsedUser.ownedCarwashes = [];
        }
        console.log('✅ [USERCONTEXT] User loaded from storage:', parsedUser);
        console.log('🔍 [USERCONTEXT] User role:', parsedUser.role);
        console.log('🔍 [USERCONTEXT] User ownedCarwashes:', parsedUser.ownedCarwashes);
        console.log('🔍 [USERCONTEXT] User ownedCarwashes length:', parsedUser.ownedCarwashes.length);
        setUser(parsedUser);
      } else {
        // No user found, wait for login
        console.log('❌ [USERCONTEXT] No user found in storage, waiting for login...');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [USERCONTEXT] Error loading user from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToStorage = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const login = async (userData: any) => {
    try {
      setLoading(true);
      
      // Convert backend user data to frontend User format
      const frontendUser: User = {
        id: userData.id,
        name: userData.firstName || 'მომხმარებელი',
        email: userData.email || '',
        phone: userData.phone,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: userData.role || 'customer',
        ownedCarwashes: userData.ownedCarwashes || [],
      };
      
      console.log('🔍 [LOGIN] Creating user with ID:', frontendUser.id);
      console.log('🔍 [LOGIN] User details:', {
        id: frontendUser.id,
        name: frontendUser.name,
        email: frontendUser.email,
        phone: frontendUser.phone,
        role: frontendUser.role,
        ownedCarwashes: frontendUser.ownedCarwashes
      });
      console.log('🔍 [LOGIN] User role:', frontendUser.role);
      console.log('🔍 [LOGIN] User ownedCarwashes:', frontendUser.ownedCarwashes);
      console.log('🔍 [LOGIN] User ownedCarwashes length:', frontendUser.ownedCarwashes?.length);

      setUser(frontendUser);
      await saveUserToStorage(frontendUser);
      
      // Register device token after login
      await registerDeviceToken(frontendUser.id);
      
      // Track login history (async, don't wait for it)
      trackLoginHistory(frontendUser).catch((err) => {
        console.error('Error tracking login history:', err);
      });
      
      // Track login in Firebase Analytics (fire-and-forget)
      analyticsService.logUserLogin(frontendUser.id, 'phone');
      
      // Set user properties (fire-and-forget)
      analyticsService.setUserProperties({
        user_role: frontendUser.role,
        user_id: frontendUser.id,
      });
      
      console.log('Login: User saved to storage and state updated');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      
      // Convert backend user data to frontend User format
      const frontendUser: User = {
        id: userData.id,
        name: userData.firstName || 'მომხმარებელი',
        email: userData.email || '',
        phone: userData.phone,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: userData.role || 'customer',
        ownedCarwashes: userData.ownedCarwashes || [],
      };
      
      console.log('🔍 [REGISTER] Creating user with ID:', frontendUser.id);
      console.log('🔍 [REGISTER] User details:', {
        id: frontendUser.id,
        name: frontendUser.name,
        email: frontendUser.email,
        phone: frontendUser.phone,
        role: frontendUser.role,
        ownedCarwashes: frontendUser.ownedCarwashes
      });
      console.log('🔍 [REGISTER] User role:', frontendUser.role);
      console.log('🔍 [REGISTER] User ownedCarwashes:', frontendUser.ownedCarwashes);
      console.log('🔍 [REGISTER] User ownedCarwashes length:', frontendUser.ownedCarwashes?.length);

      setUser(frontendUser);
      await saveUserToStorage(frontendUser);
      
      await registerDeviceToken(frontendUser.id);
      
      console.log('Register: User saved to storage and state updated');
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      console.log('User logged out and storage cleared');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      setUser(null);
      console.log('All storage cleared');
    } catch (error) {
      console.error('Clear storage error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const updateUserRole = async (role: User['role']) => {
    if (!user) return;
    
    try {
      console.log('🔄 [UPDATE_ROLE] Updating user role to:', role);
      
      // Update role in backend
      const response = await fetch(`${API_BASE_URL}/auth/update-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          role: role
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ [UPDATE_ROLE] Backend response:', result);
      
      // Update local state
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      console.log('✅ [UPDATE_ROLE] User role updated locally to:', role);
    } catch (error) {
      console.error('❌ [UPDATE_ROLE] Error updating user role:', error);
      throw error;
    }
  };

  const addToOwnedCarwashes = async (carwashId: string) => {
    if (!user) return;
    
    try {
      console.log('🔍 [ADD_CARWASH] Adding carwash to owned list:', carwashId);
      console.log('🔍 [ADD_CARWASH] Current ownedCarwashes:', user.ownedCarwashes);
      console.log('🔍 [ADD_CARWASH] User ID being sent:', user.id);
      console.log('🔍 [ADD_CARWASH] Full user object:', user);
      
      // Update ownedCarwashes in backend
      const response = await fetch(`${API_BASE_URL}/auth/update-owned-carwashes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          carwashId: carwashId,
          action: 'add'
        }),
      });
      
      console.log('🔍 [ADD_CARWASH] Response status:', response.status);
      console.log('🔍 [ADD_CARWASH] Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ [ADD_CARWASH] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ [ADD_CARWASH] Backend response:', result);
      
      // Update local state
      const currentOwnedCarwashes = user.ownedCarwashes || [];
      const updatedOwnedCarwashes = [...currentOwnedCarwashes, carwashId];
      console.log('🔍 [ADD_CARWASH] Updated ownedCarwashes:', updatedOwnedCarwashes);
      const updatedUser = { ...user, ownedCarwashes: updatedOwnedCarwashes };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      console.log('✅ [ADD_CARWASH] Added carwash to owned list:', carwashId);
      console.log('✅ [ADD_CARWASH] User role after update:', updatedUser.role);
      console.log('✅ [ADD_CARWASH] User ownedCarwashes after update:', updatedUser.ownedCarwashes);
    } catch (error) {
      console.error('❌ [ADD_CARWASH] Add to owned carwashes error:', error);
      throw error;
    }
  };

  const removeFromOwnedCarwashes = async (carwashId: string) => {
    if (!user) return;
    
    try {
      const currentOwnedCarwashes = user.ownedCarwashes || [];
      const updatedOwnedCarwashes = currentOwnedCarwashes.filter(id => id !== carwashId);
      const updatedUser = { ...user, ownedCarwashes: updatedOwnedCarwashes };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      console.log('Removed carwash from owned list:', carwashId);
    } catch (error) {
      console.error('Remove from owned carwashes error:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      clearStorage,
      updateProfile,
      updateUserRole,
      addToOwnedCarwashes,
      removeFromOwnedCarwashes,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}