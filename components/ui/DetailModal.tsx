import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export type DetailItem = {
  id: string;
  title: string;
  description?: string;
  price?: string;
  image: string;
  type: 'part' | 'store' | 'dismantler' | 'mechanic';
  // Part specific
  seller?: string;
  location?: string;
  brand?: string;
  category?: string;
  condition?: 'ახალი' | 'მეორადი' | 'რემონტის შემდეგ';
  // Store specific
  name?: string;
  phone?: string;
  address?: string;
  workingHours?: string;
  services?: string[];
  // Common
  gallery?: string[];
  features?: string[];
  specifications?: { [key: string]: string };
};

type DetailModalProps = {
  visible: boolean;
  item: DetailItem | null;
  onClose: () => void;
  onContact?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
};

export default function DetailModal({
  visible,
  item,
  onClose,
  onContact,
  onFavorite,
  isFavorite = false,
}: DetailModalProps) {
  if (!item) return null;

  const getTypeConfig = () => {
    switch (item.type) {
      case 'part':
        return {
          icon: 'cog' as const,
          color: '#111827',
          backgroundColor: '#F9FAFB',
          title: 'ნაწილის დეტალები',
          actionText: 'დაკავშირება',
        };
      case 'store':
        return {
          icon: 'storefront' as const,
          color: '#111827',
          backgroundColor: '#F9FAFB',
          title: 'მაღაზიის დეტალები',
          actionText: 'დარეკვა',
        };
      case 'dismantler':
        return {
          icon: 'car-sport' as const,
          color: '#111827',
          backgroundColor: '#F9FAFB',
          title: 'დაშლილების დეტალები',
          actionText: 'დარეკვა',
        };
      case 'mechanic':
        return {
          icon: 'construct' as const,
          color: '#111827',
          backgroundColor: '#F9FAFB',
          title: 'ხელოსნის დეტალები',
          actionText: 'დაკავშირება',
        };
    }
  };

  const config = getTypeConfig();

  // Format phone number for display (native format)
  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return '';
    
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it starts with +995, format as +995 XXX XXX XXX
    if (cleaned.startsWith('+995')) {
      const number = cleaned.substring(4); // Remove +995
      if (number.length === 9) {
        return `+995 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
      }
      return cleaned;
    }
    
    // If it's 9 digits (Georgian format), format as XXX XXX XXX
    if (cleaned.length === 9 && /^5\d{8}$/.test(cleaned)) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
    
    // If it's 12 digits starting with 995, format as +995 XXX XXX XXX
    if (cleaned.length === 12 && cleaned.startsWith('995')) {
      const number = cleaned.substring(3);
      return `+995 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
    
    return phone; // Return original if can't format
  };

  const handleCall = async () => {
    if (!item.phone) {
      Alert.alert('შეცდომა', 'ტელეფონის ნომერი არ არის მითითებული');
      return;
    }

    // Clean phone number - remove spaces, dashes, parentheses, and other characters
    // Keep only digits and + sign
    let cleanPhone = item.phone.replace(/[\s\-\(\)]/g, '');
    
    // If starts with +995, keep it, otherwise add +995 if it's a Georgian number
    if (!cleanPhone.startsWith('+')) {
      // If it's 9 digits (Georgian format), add +995
      if (cleanPhone.length === 9 && /^5\d{8}$/.test(cleanPhone)) {
        cleanPhone = `+995${cleanPhone}`;
      } else if (cleanPhone.length === 12 && cleanPhone.startsWith('995')) {
        // If it's 12 digits starting with 995, add +
        cleanPhone = `+${cleanPhone}`;
      }
    }
    
    const phoneUrl = `tel:${cleanPhone}`;

    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        // Open native phone dialer directly
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('შეცდომა', 'ტელეფონის დარეკვა ვერ მოხერხდა');
      }
    } catch (error) {
      console.error('Error opening phone call:', error);
      Alert.alert('შეცდომა', 'ტელეფონის დარეკვა ვერ მოხერხდა');
    }
  };

  const handleAction = () => {
    // If phone exists, always call
    if (item.phone) {
      handleCall();
    } else if (onContact) {
      // Fallback to onContact callback if no phone
      onContact();
    } else {
      Alert.alert('ინფორმაცია', 'კონტაქტის ინფორმაცია არ არის მითითებული');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={[styles.typeIconBadge, { backgroundColor: '#F9FAFB' }]}>
              <Ionicons name={config.icon} size={20} color="#111827" />
            </View>
            <Text style={styles.headerTitle}>{config.title}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
            onPress={onFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#EF4444" : "#6B7280"} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.heroImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.imageGradient}
            />
            {item.condition && (
              <View style={[styles.conditionBadge, { backgroundColor: config.color }]}>
                <Text style={styles.conditionText}>{item.condition}</Text>
              </View>
            )}
          </View>

          {/* Main Info */}
          <View style={styles.mainInfo}>
            <Text style={styles.title}>{item.title || item.name}</Text>
            
            {item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}

            {/* Price Section */}
            {item.price && (
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>ფასი</Text>
                <Text style={styles.price}>{item.price}</Text>
              </View>
            )}

            {/* Meta Information */}
            <View style={styles.metaSection}>
              {item.seller && (
                <View style={styles.metaRow}>
                  <Ionicons name="storefront-outline" size={18} color="#6B7280" />
                  <Text style={styles.metaLabel}>მყიდველი:</Text>
                  <Text style={styles.metaValue}>{item.seller}</Text>
                </View>
              )}
              
              {item.location && (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={18} color="#6B7280" />
                  <Text style={styles.metaLabel}>მდებარეობა:</Text>
                  <Text style={styles.metaValue}>{item.location}</Text>
                </View>
              )}

              {item.brand && (
                <View style={styles.metaRow}>
                  <Ionicons name="car-outline" size={18} color="#6B7280" />
                  <Text style={styles.metaLabel}>ბრენდი:</Text>
                  <Text style={styles.metaValue}>{item.brand}</Text>
                </View>
              )}

              {item.category && (
                <View style={styles.metaRow}>
                  <Ionicons name="layers-outline" size={18} color="#6B7280" />
                  <Text style={styles.metaLabel}>კატეგორია:</Text>
                  <Text style={styles.metaValue}>{item.category}</Text>
                </View>
              )}

              {item.phone && (
                <TouchableOpacity 
                  style={styles.metaRow}
                  onPress={handleCall}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call-outline" size={18} color="#6B7280" />
                  <Text style={styles.metaLabel}>ტელეფონი:</Text>
                  <Text style={[styles.metaValue, styles.phoneNumber]}>{formatPhoneForDisplay(item.phone)}</Text>
                  <Ionicons name="call" size={16} color="#3B82F6" />
                </TouchableOpacity>
              )}

              {item.workingHours && (
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={18} color="#6B7280" />
                  <Text style={styles.metaLabel}>მუშაობის საათები:</Text>
                  <Text style={styles.metaValue}>{item.workingHours}</Text>
                </View>
              )}
            </View>

            {/* Services */}
            {item.services && item.services.length > 0 && (
              <View style={styles.servicesSection}>
                <Text style={styles.sectionTitle}>სერვისები</Text>
                <View style={styles.servicesList}>
                  {item.services.map((service, index) => (
                    <View key={index} style={styles.serviceItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#111827" />
                      <Text style={styles.serviceText}>{service}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Features */}
            {item.features && item.features.length > 0 && (
              <View style={styles.featuresSection}>
                <Text style={styles.sectionTitle}>თავისებურებები</Text>
                <View style={styles.featuresList}>
                  {item.features.map((feature, index) => (
                    <View key={index} style={[styles.featureChip, { borderColor: '#111827' }]}>
                      <Text style={[styles.featureText, { color: '#111827' }]}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Specifications */}
            {item.specifications && (
              <View style={styles.specificationsSection}>
                <Text style={styles.sectionTitle}>სპეციფიკაციები</Text>
                <View style={styles.specsList}>
                  {Object.entries(item.specifications).map(([key, value], index) => (
                    <View key={index} style={styles.specRow}>
                      <Text style={styles.specKey}>{key}</Text>
                      <Text style={styles.specValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Gallery */}
            {item.gallery && item.gallery.length > 0 && (
              <View style={styles.gallerySection}>
                <Text style={styles.sectionTitle}>გალერეა</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={styles.galleryScrollContent}
                  style={styles.galleryScroll}
                >
                  {item.gallery.map((imageUri, index) => (
                    <TouchableOpacity key={index} style={styles.galleryItem}>
                      <Image source={{ uri: imageUri }} style={styles.galleryImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#111827' }]}
            onPress={handleAction}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{config.actionText}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    backdropFilter: 'blur(10px)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  favoriteButtonActive: {
    backgroundColor: '#FEF2F2',
  },

  // Content
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  conditionBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  conditionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Main Info
  mainInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Price
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  // Meta
  metaSection: {
    gap: 16,
    marginBottom: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    minWidth: 80,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  phoneNumber: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Services
  servicesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },

  // Features
  featuresSection: {
    marginBottom: 32,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.05)',
  },
  featureText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Specifications
  specificationsSection: {
    marginBottom: 32,
  },
  specsList: {
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  specKey: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
  },

  // Gallery
  gallerySection: {
    marginBottom: 32,
  },
  galleryScroll: {
    marginHorizontal: -20,
  },
  galleryScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  galleryItem: {
    width: 120,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Bottom Actions
  bottomActions: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
    backdropFilter: 'blur(10px)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
