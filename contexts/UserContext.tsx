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
  shouldOpenPremiumModal: boolean;
  clearPremiumModalFlag: () => void;
  setShouldOpenPremiumModal: (value: boolean) => void;
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
  const [shouldOpenPremiumModal, setShouldOpenPremiumModal] = useState(false);

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
      
      if (token) {
       
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
       
        
        const response = await fetch(`${API_BASE_URL}/notifications/register-device`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        

        
        const result = await response.json();
        
        if (response.ok && result.success) {
         
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
    const processedMessageIds = new Set<string>();
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
        if (data.requestId) {
          router.push(`/offers/${data.requestId}`);
        } else {
          router.push('/offers');
        }
        return;
      }
      if (type === 'new_offer') {
        const reqId = data.requestId as string | undefined;
        if (reqId) {
          router.push(`/offers/${reqId}`);
        } else {
          router.push('/offers');
        }
        return;
      }
      if (type?.startsWith('ai_')) {
        router.push('/offers');
        return;
      }
      if (type === 'subscription_activated' || screen === 'Premium') {
        // Navigate to home and trigger premium modal
        router.push('/');
        // Set flag to open premium modal
        setShouldOpenPremiumModal(true);
        return;
      }
      if (type === 'garage_reminder' || screen === 'Garage') {
        router.push('/(tabs)/garage');
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
            // Deduplication: შევამოწმოთ messageId
            const messageId = remoteMessage.messageId;
            if (messageId && processedMessageIds.has(messageId)) {
              return;
            }
            
            if (messageId) {
              processedMessageIds.add(messageId);
              // Cleanup old messageIds (keep last 100)
              if (processedMessageIds.size > 100) {
                const firstId = processedMessageIds.values().next().value;
                if (firstId) {
                  processedMessageIds.delete(firstId);
                }
              }
            }
            
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

      
      // Check if user role is 'customer' - should logout
      if (user.role === 'customer') {
        console.warn('⚠️ [USERCONTEXT] User has customer role, logging out...');
        logout();
        return;
      }
      
      // Verify user exists in backend
      const verifyUser = async () => {
        try {
          const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify-user/${user.id}`);
          const verifyData = await verifyResponse.json();
          
          if (!verifyData.exists || !verifyData.valid) {
            console.warn('⚠️ [USERCONTEXT] User not found in backend or invalid, logging out...');
            console.warn('⚠️ [USERCONTEXT] Reason:', verifyData.reason || 'user_not_found');
            await logout();
            return;
          }
          
          // User is valid, proceed with registration
          registerDeviceToken(user.id);
          // Track app open/login history (async, don't wait for it)
          trackLoginHistory(user).catch((err) => {
            console.error('Error tracking login history on app open:', err);
          });
        } catch (verifyError) {
          console.error('❌ [USERCONTEXT] Error verifying user:', verifyError);
          // If verification fails, still proceed but log warning
          console.warn('⚠️ [USERCONTEXT] Could not verify user, but proceeding');
          registerDeviceToken(user.id);
          trackLoginHistory(user).catch((err) => {
            console.error('Error tracking login history on app open:', err);
          });
        }
      };
      
      verifyUser();
    } else {
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        // Ensure ownedCarwashes is always an array
        if (!parsedUser.ownedCarwashes) {
          parsedUser.ownedCarwashes = [];
        }
       
        try {
          const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify-user/${parsedUser.id}`);
          const verifyData = await verifyResponse.json();
          
          if (!verifyData.exists || !verifyData.valid) {
            console.warn('⚠️ [USERCONTEXT] User not found in backend or invalid role, logging out...');
            console.warn('⚠️ [USERCONTEXT] Reason:', verifyData.reason || 'user_not_found');
            await logout();
            setUser(null);
            return;
          }
          
          // User is valid, set it
          setUser(parsedUser);
        } catch (verifyError) {
          console.error('❌ [USERCONTEXT] Error verifying user:', verifyError);
          // If verification fails, still set user but log warning
          console.warn('⚠️ [USERCONTEXT] Could not verify user, but keeping logged in');
          setUser(parsedUser);
        }
      } else {
        // No user found, wait for login
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
      

      setUser(frontendUser);
      await saveUserToStorage(frontendUser);
      
      await registerDeviceToken(frontendUser.id);
      
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
      // ასევე წავშალოთ საბსქრიფშენი, რადგან ის ეკუთვნის ამ იუზერს
      await AsyncStorage.removeItem('user_subscription');
      setUser(null);
      // Navigate to login page
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      setUser(null);
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
      
      
      // Update local state
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
    } catch (error) {
      console.error('❌ [UPDATE_ROLE] Error updating user role:', error);
      throw error;
    }
  };

  const addToOwnedCarwashes = async (carwashId: string) => {
    if (!user) return;
    
    try {

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
      

      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Update local state
      const currentOwnedCarwashes = user.ownedCarwashes || [];
      const updatedOwnedCarwashes = [...currentOwnedCarwashes, carwashId];
      const updatedUser = { ...user, ownedCarwashes: updatedOwnedCarwashes };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);

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
    } catch (error) {
      console.error('Remove from owned carwashes error:', error);
      throw error;
    }
  };

  const clearPremiumModalFlag = () => {
    setShouldOpenPremiumModal(false);
  };

  return (
    <UserContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      shouldOpenPremiumModal,
      clearPremiumModalFlag,
      setShouldOpenPremiumModal,
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