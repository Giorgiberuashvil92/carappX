import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export interface SpecialOfferModalData {
  id?: string;
  storeId?: string;
  discount?: string;
  oldPrice?: string;
  newPrice?: string;
  price?: string;
  title?: string;
  description?: string;
  image?: string;
  name?: string;
  location?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  images?: string[];
  [key: string]: any;
}

type SpecialOfferModalProps = {
  visible: boolean;
  offer: SpecialOfferModalData | null;
  onClose: () => void;
  onContact?: () => void;
};

export default function SpecialOfferModal({
  visible,
  offer,
  onClose,
  onContact,
}: SpecialOfferModalProps) {
  const router = useRouter();
  
  if (!offer) return null;

  const handleCall = () => {
    if (offer.phone) {
      const cleanPhone = offer.phone.replace(/[\s\-\(\)]/g, '');
      const phoneNumber = cleanPhone.startsWith('+995') 
        ? cleanPhone 
        : cleanPhone.startsWith('995')
        ? `+${cleanPhone}`
        : `+995${cleanPhone}`;
      
      Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
        console.error('Error opening phone:', err);
      });
    }
    if (onContact) onContact();
  };

  const handleMapPress = () => {
    const storeName = offer.name || offer.title || 'მაღაზია';
    
    if (offer.latitude && offer.longitude) {
      // Use coordinates if available for more accuracy
      const url = Platform.OS === 'ios' 
        ? `maps://?ll=${offer.latitude},${offer.longitude}&q=${encodeURIComponent(storeName)}`
        : `geo:${offer.latitude},${offer.longitude}?q=${offer.latitude},${offer.longitude}(${encodeURIComponent(storeName)})`;
      
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web with coordinates
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${offer.latitude},${offer.longitude}`);
      });
    } else if (offer.address || offer.location) {
      // Use full address with city for better accuracy
      const fullAddress = offer.address 
        ? `${offer.address}, თბილისი, საქართველო`
        : `${offer.location}, თბილისი, საქართველო`;
      
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
      Linking.openURL(googleMapsUrl).catch((err) => {
        console.error('Error opening Google Maps:', err);
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View 
          style={styles.modalContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <View style={styles.closeButtonView}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Content Section */}
            <View style={styles.content}>
              {/* Title with Badges */}
              <View style={styles.titleSection}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>
                    {offer.title || offer.name || 'სპეციალური შეთავაზება'}
                  </Text>
                  {offer.discount && (
                    <View style={styles.discountBadgeInline}>
                      <Text style={styles.discountTextInline}>-{offer.discount}%</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Price Section */}
              <View style={styles.priceSection}>
                {offer.oldPrice && (
                  <Text style={styles.oldPrice}>{offer.oldPrice}</Text>
                )}
                <Text style={styles.newPrice}>
                  {offer.newPrice || offer.price || 'ფასი მოთხოვნის შემთხვევაში'}
                </Text>
              </View>

              {/* Store Info */}
              {offer.name && (
                <View style={styles.storeInfo}>
                  <View style={styles.storeInfoRow}>
                    <Ionicons name="storefront" size={18} color="#3B82F6" />
                    <Text style={styles.storeName}>{offer.name}</Text>
                  </View>
                  {(offer.address || offer.location) && (
                    <View style={styles.storeInfoRow}>
                      <Ionicons name="location" size={18} color="#6B7280" />
                      <Text style={styles.storeLocation}>{offer.address || offer.location}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Description */}
              {offer.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionTitle}>აღწერა</Text>
                  <Text style={styles.descriptionText}>{offer.description}</Text>
                </View>
              )}

              {/* Details */}
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag-outline" size={20} color="#3B82F6" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>ფასდაკლება</Text>
                    <Text style={styles.detailValue}>
                      {offer.discount ? `${offer.discount}%` : 'არ არის მითითებული'}
                    </Text>
                  </View>
                </View>

                {offer.oldPrice && (
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={20} color="#10B981" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>ძველი ფასი</Text>
                      <Text style={styles.detailValue}>{offer.oldPrice}</Text>
                    </View>
                  </View>
                )}

                {offer.newPrice && (
                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={20} color="#EF4444" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>ახალი ფასი</Text>
                      <Text style={[styles.detailValue, styles.newPriceValue]}>
                        {offer.newPrice}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              {(offer.address || offer.location || (offer.latitude && offer.longitude)) && (
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={handleMapPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.mapButtonContent}>
                    <Ionicons name="map" size={20} color="#3B82F6" />
                    <Text style={styles.mapButtonText}>რუკა</Text>
                  </View>
                </TouchableOpacity>
              )}
              {offer.phone && (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCall}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    style={styles.callButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="call" size={20} color="#FFFFFF" />
                    <Text style={styles.callButtonText}>დარეკვა</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: height * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  closeButtonView: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
  },
  scrollView: {
    maxHeight: height * 0.5,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  titleSection: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    fontFamily: 'Inter',
  },
  discountBadgeInline: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  discountTextInline: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  oldPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontFamily: 'Inter',
  },
  newPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'Inter',
  },
  storeInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    gap: 12,
  },
  storeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  storeLocation: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  detailsSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  newPriceValue: {
    color: '#10B981',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mapButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  mapButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    fontFamily: 'Inter',
  },
  callButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  callButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});

