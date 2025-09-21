import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import GlobalModal, { ModalType, ModalConfig } from '../components/ui/GlobalModal';
import { AddCarModalContent, StandardFooter } from '../components/ui/ModalTypes';

type ModalContextType = {
  showModal: (config: ModalConfig) => void;
  hideModal: () => void;
  isVisible: boolean;
  currentConfig: ModalConfig | null;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

type ModalProviderProps = {
  children: React.ReactNode;
};

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ModalConfig | null>(null);

  const showModal = useCallback((config: ModalConfig) => {
    setCurrentConfig(config);
    setIsVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsVisible(false);
    // Delay clearing config to allow animation to complete
    setTimeout(() => {
      setCurrentConfig(null);
    }, 300);
  }, []);

  const contextValue: ModalContextType = {
    showModal,
    hideModal,
    isVisible,
    currentConfig,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      {currentConfig && (
        <GlobalModal 
          visible={isVisible} 
          config={{
            ...currentConfig,
            onClose: hideModal,
          }}
        />
      )}
    </ModalContext.Provider>
  );
};

// Convenience hooks for common modal types
export const useCarModal = () => {
  const { showModal, hideModal } = useModal();
  
  return {
    showAddCarModal: (onAddCar: (car: any) => void) => {
      showModal({
        type: 'add-car',
        title: 'ახალი მანქანა',
        subtitle: 'შეიყვანეთ ინფორმაცია',
        icon: 'car-outline',
        content: (
          <AddCarModalContent 
            onAddCar={onAddCar} 
            onCancel={() => hideModal()} 
          />
        ),
        onClose: () => {},
      });
    },
  };
};

export const useReminderModal = () => {
  const { showModal } = useModal();
  
  return {
    showAddReminderModal: (onAddReminder: (reminder: any) => void) => {
      showModal({
        type: 'add-reminder',
        title: 'ახალი შეხსენება',
        subtitle: 'შეიყვანეთ ინფორმაცია',
        icon: 'alarm-outline',
        headerGradient: ['#667eea', '#764ba2'],
        content: <Text>Add Reminder Form will go here</Text>,
        footer: (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={{ flex: 1, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12 }}>
              <Text style={{ textAlign: 'center', color: '#6B7280' }}>გაუქმება</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 2, padding: 12, backgroundColor: '#3B82F6', borderRadius: 12 }}>
              <Text style={{ textAlign: 'center', color: '#FFFFFF' }}>დამატება</Text>
            </TouchableOpacity>
          </View>
        ),
        onClose: () => {},
      });
    },
  };
};

export const useDetailModal = () => {
  const { showModal } = useModal();
  
  return {
    showDetailModal: (item: any, onContact?: () => void, onFavorite?: () => void) => {
      showModal({
        type: 'detail-item',
        title: item.title || 'დეტალები',
        subtitle: item.type || 'ინფორმაცია',
        icon: 'information-circle-outline',
        content: <Text>Detail content will go here</Text>,
        footer: (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={{ flex: 1, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12 }}>
              <Text style={{ textAlign: 'center', color: '#6B7280' }}>დახურვა</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 12, backgroundColor: '#3B82F6', borderRadius: 12 }}>
              <Text style={{ textAlign: 'center', color: '#FFFFFF' }}>კონტაქტი</Text>
            </TouchableOpacity>
          </View>
        ),
        onClose: () => {},
      });
    },
  };
};
