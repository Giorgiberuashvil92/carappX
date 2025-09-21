import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  StatusBar,
  Image,
  ColorValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

export type ModalType = 
  | 'add-car'
  | 'add-reminder' 
  | 'car-detail'
  | 'add-item'
  | 'detail-item'
  | 'booking-details'
  | 'cancel-booking'
  | 'rebook'
  | 'filter'
  | 'custom';

export type ModalConfig = {
  type: ModalType;
  title: string;
  subtitle?: string;
  icon?: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
  height?: number;
  backgroundColor?: string;
  headerGradient?: string[];
  transparent?: boolean;
};

type GlobalModalProps = {
  visible: boolean;
  config: ModalConfig;
};

export default function GlobalModal({ visible, config }: GlobalModalProps) {
  const slideY = React.useRef(new Animated.Value(height)).current;
  const bgOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(bgOpacity, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.spring(slideY, { 
          toValue: 0, 
          useNativeDriver: true, 
          friction: 8, 
          tension: 100 
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgOpacity, { 
          toValue: 0, 
          duration: 250, 
          useNativeDriver: true 
        }),
        Animated.timing(slideY, { 
          toValue: height, 
          duration: 300, 
          useNativeDriver: true 
        }),
      ]).start();
    }
  }, [visible]);

  const handleOverlayPress = () => {
    if (config.closeOnOverlay) {
      config.onClose();
    }
  };

  const renderHeader = () => {
    if (config.headerGradient) {
      return (
        <LinearGradient
          colors={config.headerGradient as [ColorValue, ColorValue, ...ColorValue[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              {config.icon && (
                <View style={styles.iconContainer}>
                  <Ionicons name={config.icon as any} size={24} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.titleContainer}>
                <Text style={styles.titleGradient}>{config.title}</Text>
                {config.subtitle && (
                  <Text style={styles.subtitleGradient}>{config.subtitle}</Text>
                )}
              </View>
            </View>
            {config.showCloseButton !== false && (
              <TouchableOpacity style={styles.closeButtonGradient} onPress={config.onClose}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      );
    }

    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {config.icon && (
              <View style={styles.iconContainerSimple}>
                <Ionicons name={config.icon as any} size={24} color="#1F2937" />
              </View>
            )}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{config.title}</Text>
              {config.subtitle && (
                <Text style={styles.subtitle}>{config.subtitle}</Text>
              )}
            </View>
          </View>
          {config.showCloseButton !== false && (
            <TouchableOpacity style={styles.closeButton} onPress={config.onClose}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    const contentStyle = [
      styles.content,
      { 
        height: config.height ? height * config.height : height * 0.75,
        backgroundColor: config.backgroundColor || '#FFFFFF'
      }
    ];

    return (
      <ScrollView 
        style={contentStyle} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {config.content}
      </ScrollView>
    );
  };

  const renderFooter = () => {
    if (!config.footer) return null;
    
    return (
      <View style={styles.footer}>
        {config.footer}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal 
      visible={visible} 
      transparent={config.transparent !== false}
      animationType="none" 
      onRequestClose={config.onClose} 
      statusBarTranslucent
      presentationStyle={config.presentationStyle || 'overFullScreen'}
    >
      <StatusBar 
        backgroundColor={config.transparent === false ? '#FFFFFF' : 'rgba(0,0,0,0.5)'} 
        barStyle="light-content" 
      />
      
      {config.transparent !== false && (
        <Animated.View 
          style={[styles.overlay, { opacity: bgOpacity }]} 
          onTouchEnd={handleOverlayPress}
        />
      )}

      <Animated.View 
        style={[
          styles.sheet, 
          { 
            transform: [{ translateY: slideY }],
            height: config.height ? height * config.height : height * 0.9,
            backgroundColor: config.backgroundColor || '#FFFFFF'
          }
        ]}
      >
        {renderHeader()}
        {renderContent()}
        {renderFooter()}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  
  // Gradient Header Styles
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  titleGradient: {
    fontSize: 22,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  subtitleGradient: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter',
  },
  closeButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Simple Header Styles
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainerSimple: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content Styles
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  // Footer Styles
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});
