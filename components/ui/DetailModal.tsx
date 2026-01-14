import React, { useState, useRef } from 'react';
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
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

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
  alternativePhone?: string;
  email?: string;
  website?: string;
  address?: string;
  workingHours?: string;
  services?: string[];
  specializations?: string[];
  ownerName?: string;
  managerName?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  yearEstablished?: number;
  employeeCount?: number;
  license?: string;
  latitude?: number;
  longitude?: number;
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
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  if (!item) return null;

  const images = item.gallery && item.gallery.length > 0 ? item.gallery : [item.image];

  const getTypeConfig = () => {
    switch (item.type) {
      case 'part':
        return {
          icon: 'cog' as const,
          color: '#111827',
          backgroundColor: '#F9FAFB',
          title: 'ნაწილის დეტალები',
          subtitle: 'ნაწილი',
          actionText: 'დაკავშირება',
          price: item.price || '₾199',
        };
      case 'store':
        return {
          icon: 'storefront' as const,
          color: '#111827',
          backgroundColor: '#F9FAFB',
          title: item.name || item.title,
          subtitle: item.type || 'ავტომაღაზია',
          actionText: 'დაკავშირება',
          price: '$98',
        };
      case 'dismantler':
        return {
          icon: 'car-sport' as const,
          color: '#111827',
          backgroundColor: '#F9FAFB',
          title: item.name || item.title,
          subtitle: 'დამშლელი',
          actionText: 'დაკავშირება',
          price: '$98',
        };
      case 'mechanic':
        return {
          icon: 'construct' as const,
          color: '#111827',
          backgroundColor: '#F9FAFB',
          title: item.name || item.title,
          subtitle: 'ხელოსანი',
          actionText: 'დაკავშირება',
          price: item.price || '$98',
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

  const handleCall = async (phoneNumber?: string) => {
    const phoneToUse = phoneNumber || item.phone;
    
    if (!phoneToUse) {
      Alert.alert('შეცდომა', 'ტელეფონის ნომერი არ არის მითითებული');
      return;
    }

    // Clean phone number - remove spaces, dashes, parentheses, and other characters
    // Keep only digits and + sign
    let cleanPhone = phoneToUse.replace(/[\s\-\(\)]/g, '');
    
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
      handleCall(item.phone);
    } else if (item.alternativePhone) {
      // Use alternative phone if main phone doesn't exist
      handleCall(item.alternativePhone);
    } else if (onContact) {
      // Fallback to onContact callback if no phone
      onContact();
    } else {
      Alert.alert('ინფორმაცია', 'კონტაქტის ინფორმაცია არ არის მითითებული');
    }
  };

  const defaultDescription = item.type === 'store' 
    ? `${item.name || 'ჩვენი მაღაზია'} არის საქართველოში წამყვანი ავტონაწილების მაღაზია. ჩვენ ვთავაზობთ ხარისხიან პროდუქტებს და პროფესიონალურ მომსახურებას, რომელიც დააკმაყოფილებს თქვენს ყველა საჭიროებას.`
    : `ხარისხიანი პროდუქტი და სერვისი თქვენი ავტომობილისთვის. ჩვენ ვზრუნავთ თქვენს უსაფრთხოებასა და კომფორტზე.`;
  
  const description = item.description || defaultDescription;
  const truncatedDescription = description.length > 150 && !showFullDescription
    ? description.substring(0, 150) + '...'
    : description;

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentImageIndex(roundIndex);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Full Screen Image Carousel */}
        <View style={styles.fullImageContainer}>
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item: imageUri }) => (
              <View style={styles.fullImageWrapper}>
                <Image source={{ uri: imageUri }} style={styles.fullImage} />
              </View>
            )}
          />
          
          {/* Header Overlay */}
          <SafeAreaView style={styles.headerOverlay} edges={['top']}>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.overlayButton} onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.overlayButton}>
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          
          {/* Pagination Counter */}
          <View style={styles.paginationCounter}>
            <Text style={styles.paginationText}>
              {currentImageIndex + 1}/{images.length}
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* Content Card */}
          <View style={styles.contentCard}>
            {/* Title and Rating */}
           

            {/* Agency Info Card */}
          

            {/* Technical Specifications */}
            

            {/* Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>აღწერა</Text>
              <Text style={styles.descriptionText}>
                {truncatedDescription}
                {description.length > 150 && (
                  <Text 
                    style={styles.readMoreText}
                    onPress={() => setShowFullDescription(!showFullDescription)}
                  >
                    {showFullDescription ? ' ნაკლები' : ' მეტის ნახვა...'}
                  </Text>
                )}
              </Text>
            </View>

            {/* Services */}
            {item.services && item.services.length > 0 && (
              <View style={styles.servicesSection}>
                <Text style={styles.servicesSectionTitle}>მომსახურებები</Text>
                <View style={styles.servicesList}>
                  {item.services.map((service, index) => (
                    <View key={index} style={styles.serviceItem}>
                      <View style={styles.serviceCheckmark}>
                        <Ionicons name="checkmark" size={14} color="#10B981" />
                      </View>
                      <Text style={styles.serviceText}>{service}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Location and Map */}
            {(item.location || item.address) && (
              <View style={styles.locationSection}>
                <View style={styles.locationHeader}>
                  <Ionicons name="location" size={20} color="#EF4444" />
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.locationCity}>{item.location}</Text>
                    {item.address && item.address !== item.location && (
                      <Text style={styles.locationAddress}>{item.address}</Text>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => {
                    // Use coordinates if available for more accuracy
                    if (item.latitude && item.longitude) {
                      const url = Platform.OS === 'ios' 
                        ? `maps://?ll=${item.latitude},${item.longitude}&q=${encodeURIComponent(item.name || '')}`
                        : `geo:${item.latitude},${item.longitude}?q=${item.latitude},${item.longitude}(${encodeURIComponent(item.name || '')})`;
                      Linking.openURL(url).catch(() => {
                        // Fallback to Google Maps web with coordinates
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`);
                      });
                    } else {
                      // Use full address with city for better accuracy
                      const fullAddress = item.address 
                        ? `${item.address}, ${item.location || ''}` 
                        : (item.location || '');
                      const query = encodeURIComponent(fullAddress);
                      const url = Platform.OS === 'ios' 
                        ? `maps://app?q=${query}`
                        : `geo:0,0?q=${query}`;
                      Linking.openURL(url).catch(() => {
                        // Fallback to Google Maps web
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                      });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={18} color="#3B82F6" />
                  <Text style={styles.mapButtonText}>Google Maps-ზე ნახვა</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Working Hours */}
            {item.workingHours && (
              <View style={styles.workingHoursSection}>
                <View style={styles.workingHoursRow}>
                  <Ionicons name="time-outline" size={20} color="#F59E0B" />
                  <View style={styles.workingHoursTextContainer}>
                    <Text style={styles.workingHoursLabel}>სამუშაო საათები</Text>
                    <Text style={styles.workingHoursValue}>{item.workingHours}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Social Media */}
            {(item.facebook || item.instagram || item.youtube) && (
              <View style={styles.socialSection}>
                <Text style={styles.socialSectionTitle}>სოციალური მედია</Text>
                <View style={styles.socialLinks}>
                  {item.facebook && (
                    <TouchableOpacity 
                      style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                      onPress={() => {
                        if (item.facebook) {
                          Linking.openURL(item.facebook).catch(() => {});
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  {item.instagram && (
                    <TouchableOpacity 
                      style={[styles.socialButton, { backgroundColor: '#E4405F' }]}
                      onPress={() => {
                        if (item.instagram) {
                          Linking.openURL(item.instagram).catch(() => {});
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-instagram" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  {item.youtube && (
                    <TouchableOpacity 
                      style={[styles.socialButton, { backgroundColor: '#FF0000' }]}
                      onPress={() => {
                        if (item.youtube) {
                          Linking.openURL(item.youtube).catch(() => {});
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-youtube" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Specializations */}
            {item.specializations && item.specializations.length > 0 && (
              <View style={styles.specializationsSection}>
                <Text style={styles.specializationsSectionTitle}>სპეციალიზაცია</Text>
                <View style={styles.specializationsList}>
                  {item.specializations.map((spec, index) => (
                    <View key={index} style={styles.specializationChip}>
                      <Text style={styles.specializationText}>{spec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Additional Info */}
            {(item.yearEstablished || item.employeeCount || item.ownerName || item.managerName || item.license) && (
              <View style={styles.additionalInfoSection}>
                <Text style={styles.additionalInfoTitle}>დამატებითი ინფორმაცია</Text>
                <View style={styles.additionalInfoGrid}>
                  {item.yearEstablished && (
                    <View style={styles.infoCard}>
                      <Ionicons name="calendar" size={20} color="#3B82F6" />
                      <Text style={styles.infoCardLabel}>დაარსების წელი</Text>
                      <Text style={styles.infoCardValue}>{item.yearEstablished}</Text>
                    </View>
                  )}
                  {item.employeeCount && (
                    <View style={styles.infoCard}>
                      <Ionicons name="people" size={20} color="#10B981" />
                      <Text style={styles.infoCardLabel}>თანამშრომლები</Text>
                      <Text style={styles.infoCardValue}>{item.employeeCount}</Text>
                    </View>
                  )}
                </View>
                {item.ownerName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>მფლობელი:</Text>
                    <Text style={styles.infoValue}>{item.ownerName}</Text>
                  </View>
                )}
                {item.managerName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>მენეჯერი:</Text>
                    <Text style={styles.infoValue}>{item.managerName}</Text>
                  </View>
                )}
                {item.license && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ლიცენზია:</Text>
                    <Text style={styles.infoValue}>{item.license}</Text>
                  </View>
                )}
              </View>
            )}

          </View>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleAction}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={20} color="#111827" />
            <Text style={styles.bookButtonText}>დარეკვა</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.installmentButton}
            onPress={() => {
              onClose();
              setTimeout(() => {
                router.push('/financing-info');
              }, 300);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="card-outline" size={20} color="#111827" />
            <Text style={styles.installmentButtonText}>განვადება</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Full Screen Image
  fullImageContainer: {
    height: height * 0.45,
    backgroundColor: '#000000',
    position: 'relative',
  },
  fullImageWrapper: {
    width: width,
    height: height * 0.45,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  // Header Overlay
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 12,
  },
  overlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  
  // Pagination Counter
  paginationCounter: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  paginationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
    marginTop: -24,
  },
  
  // Content Card
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Title Section
  titleSection: {
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.7,
    lineHeight: 32,
  },
  carRating: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  
  // Agency Card
  agencyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
  },
  agencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  agencyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agencyInfo: {
    flex: 1,
  },
  agencyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  agencyRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  rentalRulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rentalRulesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  
  // Technical Specifications
  techSpecsSection: {
    marginBottom: 18,
  },
  techSpecsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  techSpecsScroll: {
    gap: 10,
  },
  techSpecCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: width * 0.36,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  techSpecLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  techSpecValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  
  // Description Section
  descriptionSection: {
    marginBottom: 20,
    paddingTop: 4,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  descriptionText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 24,
    letterSpacing: -0.1,
    fontWeight: '400',
  },
  readMoreText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  
  // Services Section
  servicesSection: {
    marginBottom: 24,
  },
  servicesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    letterSpacing: -0.1,
    flex: 1,
  },

  // Location Section
  locationSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationCity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    letterSpacing: -0.1,
  },
  
  // Working Hours Section
  workingHoursSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  workingHoursRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  workingHoursTextContainer: {
    flex: 1,
  },
  workingHoursLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  workingHoursValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  
  // Social Media Section
  socialSection: {
    marginBottom: 24,
  },
  socialSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Specializations Section
  specializationsSection: {
    marginBottom: 24,
  },
  specializationsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  specializationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  specializationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    letterSpacing: -0.1,
  },
  
  // Additional Info Section
  additionalInfoSection: {
    marginBottom: 24,
  },
  additionalInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  additionalInfoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  // Bottom Button Container
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    zIndex: 100,
    flexDirection: 'row',
    gap: 12,
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  installmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  installmentButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
});
