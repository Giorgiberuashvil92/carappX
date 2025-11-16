import { useState, useCallback } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';

export interface UseSubscriptionModalReturn {
  showSubscriptionModal: () => void;
  hideSubscriptionModal: () => void;
  isModalVisible: boolean;
  shouldShowModal: boolean;
  checkAndShowModal: (feature: string) => boolean;
}

export function useSubscriptionModal(): UseSubscriptionModalReturn {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const { subscription, hasActiveSubscription, isPremiumUser, isBasicUser } = useSubscription();

  const showSubscriptionModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const hideSubscriptionModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const shouldShowModal = useCallback(() => {
    // Show modal if user doesn't have active subscription or is on free plan
    return !hasActiveSubscription || subscription?.plan === 'free';
  }, [hasActiveSubscription, subscription?.plan]);

  const checkAndShowModal = useCallback((feature: string): boolean => {
    // Check if user can access the feature
    const canAccess = hasActiveSubscription && (isPremiumUser || isBasicUser);
    
    if (!canAccess) {
      showSubscriptionModal();
      return false;
    }
    
    return true;
  }, [hasActiveSubscription, isPremiumUser, isBasicUser, showSubscriptionModal]);

  return {
    showSubscriptionModal,
    hideSubscriptionModal,
    isModalVisible,
    shouldShowModal: shouldShowModal(),
    checkAndShowModal,
  };
}

// Specific hooks for different features
export function usePremiumFeature() {
  const { isPremiumUser, showSubscriptionModal } = useSubscriptionModal();
  
  const checkPremiumAccess = useCallback((feature: string): boolean => {
    if (!isPremiumUser) {
      showSubscriptionModal();
      return false;
    }
    return true;
  }, [isPremiumUser, showSubscriptionModal]);

  return { isPremiumUser, checkPremiumAccess };
}

export function useBasicFeature() {
  const { isBasicUser, isPremiumUser, showSubscriptionModal } = useSubscriptionModal();
  
  const checkBasicAccess = useCallback((feature: string): boolean => {
    const hasAccess = isBasicUser || isPremiumUser;
    if (!hasAccess) {
      showSubscriptionModal();
      return false;
    }
    return true;
  }, [isBasicUser, isPremiumUser, showSubscriptionModal]);

  return { hasBasicAccess: isBasicUser || isPremiumUser, checkBasicAccess };
}

export function useCarFAXAccess() {
  const { subscription, showSubscriptionModal } = useSubscriptionModal();
  
  const checkCarFAXAccess = useCallback((): boolean => {
    if (!subscription || subscription.plan === 'free') {
      showSubscriptionModal();
      return false;
    }
    return true;
  }, [subscription, showSubscriptionModal]);

  return { canAccessCarFAX: subscription?.plan !== 'free', checkCarFAXAccess };
}

export function useAIRecommendations() {
  const { subscription, showSubscriptionModal } = useSubscriptionModal();
  
  const checkAIRecommendationsAccess = useCallback((): boolean => {
    if (!subscription || subscription.plan === 'free') {
      showSubscriptionModal();
      return false;
    }
    return true;
  }, [subscription, showSubscriptionModal]);

  return { canAccessAI: subscription?.plan !== 'free', checkAIRecommendationsAccess };
}
