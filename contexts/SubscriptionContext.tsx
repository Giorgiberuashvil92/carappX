import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';
import { useUser } from './UserContext';

export interface Subscription {
  id: string;
  plan: 'free' | 'basic' | 'premium';
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  price: number;
  currency: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  hasActiveSubscription: boolean;
  isPremiumUser: boolean;
  isBasicUser: boolean;
  updateSubscription: (subscription: Subscription) => void;
  clearSubscription: () => void;
  checkSubscriptionStatus: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Default free subscription
  const defaultSubscription: Subscription = {
    id: 'free_default',
    plan: 'free',
    status: 'active',
    startDate: new Date().toISOString(),
    autoRenew: false,
    price: 0,
    currency: 'GEL',
  };

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]); // Add loadSubscription as dependency

  const loadSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get user from context
      const user = await AsyncStorage.getItem('user');
      
      if (user?.id) {
        // Try to load from backend first
        try {
          const response = await fetch(`${API_BASE_URL}/payments/subscription/user/${user.id}/status`);
          const result = await response.json();
          
          console.log('📋 Backend subscription response:', result);
          
          if (result.success && result.data) {
            const subscriptionData = result.data;
            const backendSubscription = {
              id: subscriptionData._id || 'backend_subscription',
              plan: subscriptionData.planId || 'free',
              status: subscriptionData.status || 'active',
              startDate: subscriptionData.startDate || new Date().toISOString(),
              endDate: subscriptionData.nextBillingDate,
              autoRenew: true,
              price: subscriptionData.planPrice || 0,
              currency: subscriptionData.currency || 'GEL',
            };
            
            setSubscription(backendSubscription);
            await AsyncStorage.setItem('user_subscription', JSON.stringify(backendSubscription));
            console.log('📋 Subscription loaded from backend:', backendSubscription);
            return;
          }
        } catch (backendError) {
          console.log('⚠️ Backend subscription check failed, using local storage');
        }
      }
      
      // Fallback to local storage
      const storedSubscription = await AsyncStorage.getItem('user_subscription');
      
      if (storedSubscription) {
        const parsedSubscription = JSON.parse(storedSubscription);
        setSubscription(parsedSubscription);
        console.log('📋 Subscription loaded from storage:', parsedSubscription);
      } else {
        // Set default free subscription
        setSubscription(defaultSubscription);
        await AsyncStorage.setItem('user_subscription', JSON.stringify(defaultSubscription));
        console.log('🆓 Default free subscription set');
      }
    } catch (error) {
      console.error('❌ Error loading subscription:', error);
      setSubscription(defaultSubscription);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array

  const updateSubscription = async (newSubscription: Subscription) => {
    try {
      setSubscription(newSubscription);
      await AsyncStorage.setItem('user_subscription', JSON.stringify(newSubscription));
      console.log('✅ Subscription updated:', newSubscription);
    } catch (error) {
      console.error('❌ Error updating subscription:', error);
    }
  };

  const clearSubscription = async () => {
    try {
      setSubscription(null);
      await AsyncStorage.removeItem('user_subscription');
      console.log('🗑️ Subscription cleared');
    } catch (error) {
      console.error('❌ Error clearing subscription:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      if (!subscription) return;

      const now = new Date();
      const endDate = subscription.endDate ? new Date(subscription.endDate) : null;

      // Check if subscription is expired
      if (endDate && now > endDate && subscription.status === 'active') {
        const expiredSubscription = {
          ...subscription,
          status: 'expired' as const,
        };
        await updateSubscription(expiredSubscription);
        console.log('⏰ Subscription expired');
      }
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
    }
  };

  const refreshSubscription = useCallback(async () => {
    console.log('🔄 Force refreshing subscription...');
    await loadSubscription();
  }, [loadSubscription]);

  const hasActiveSubscription = subscription?.status === 'active';
  const isPremiumUser = hasActiveSubscription && subscription?.plan === 'premium';
  const isBasicUser = hasActiveSubscription && subscription?.plan === 'basic';

  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    hasActiveSubscription,
    isPremiumUser,
    isBasicUser,
    updateSubscription,
    clearSubscription,
    checkSubscriptionStatus,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Helper functions
export const getSubscriptionFeatures = (plan: string) => {
  switch (plan) {
    case 'free':
      return {
        aiRecommendations: 5, // per day
        carfaxReports: 0,
        prioritySupport: false,
        exclusiveFeatures: false,
        earlyAccess: false,
      };
    case 'basic':
      return {
        aiRecommendations: -1, // unlimited
        carfaxReports: 3, // per month
        prioritySupport: false,
        exclusiveFeatures: false,
        earlyAccess: false,
      };
    case 'premium':
      return {
        aiRecommendations: -1, // unlimited
        carfaxReports: -1, // unlimited
        prioritySupport: true,
        exclusiveFeatures: true,
        earlyAccess: true,
      };
    default:
      return {
        aiRecommendations: 0,
        carfaxReports: 0,
        prioritySupport: false,
        exclusiveFeatures: false,
        earlyAccess: false,
      };
  }
};

export const canUseFeature = (subscription: Subscription | null, feature: keyof ReturnType<typeof getSubscriptionFeatures>): boolean => {
  if (!subscription || subscription.status !== 'active') {
    return false;
  }

  const features = getSubscriptionFeatures(subscription.plan);
  return features[feature] === true || features[feature] === -1 || features[feature] > 0;
};
