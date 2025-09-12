import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  PanResponder,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface Mechanic {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  experience: string;
  location: string;
  distance: string;
  price: string;
  avatar: string;
  isAvailable: boolean;
  services: string[];
  description: string;
  phone: string;
  workingHours: string;
  languages: string[];
  certifications: string[];
  portfolio: string[];
}

const MECHANICS_DATA: { [key: string]: Mechanic } = {
  '1': {
    id: '1',
    name: 'გიორგი ბერიძე',
    specialty: 'ელექტრიკოსი',
    rating: 4.9,
    reviews: 127,
    experience: '8 წელი',
    location: 'ვაკე, თბილისი',
    distance: '2.3 კმ',
    price: '50₾/საათი',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    isAvailable: true,
    services: ['ელექტრო სისტემა', 'ბატარეა', 'გენერატორი', 'სტარტერი', 'ფარები', 'სიგნალები'],
    description: 'პროფესიონალური ელექტრიკოსი 8 წლიანი გამოცდილებით. სპეციალიზებული ყველა ტიპის ავტომობილზე. მუშაობს 24/7 რეჟიმში და უზრუნველყოფს ხარისხიან სერვისს.',
    phone: '+995 555 123 456',
    workingHours: '24/7',
    languages: ['ქართული', 'ინგლისური', 'რუსული'],
    certifications: ['ISO 9001', 'Automotive Electrician Certificate'],
    portfolio: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=400&auto=format&fit=crop',
    ]
  },
  '2': {
    id: '2',
    name: 'ლევან კვარაცხელია',
    specialty: 'მექანიკოსი',
    rating: 4.8,
    reviews: 89,
    experience: '12 წელი',
    location: 'ისანი, თბილისი',
    distance: '4.1 კმ',
    price: '45₾/საათი',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
    isAvailable: true,
    services: ['ძრავი', 'ტრანსმისია', 'საბურავები', 'ფრენები', 'შეკეთება', 'მოვლა'],
    description: 'გამოცდილი მექანიკოსი ყველა ტიპის ავტომობილის შეკეთებაზე. 24/7 სერვისი. სპეციალიზებული BMW, Mercedes, Toyota მარკებზე.',
    phone: '+995 555 234 567',
    workingHours: '24/7',
    languages: ['ქართული', 'ინგლისური'],
    certifications: ['ASE Certified', 'BMW Specialist'],
    portfolio: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=400&auto=format&fit=crop',
    ]
  },
  '3': {
    id: '3',
    name: 'ნინო ჩხიკვაძე',
    specialty: 'დიაგნოსტიკა',
    rating: 4.9,
    reviews: 156,
    experience: '6 წელი',
    location: 'საბურთალო, თბილისი',
    distance: '1.8 კმ',
    price: '60₾/საათი',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400&auto=format&fit=crop',
    isAvailable: false,
    services: ['კომპიუტერული დიაგნოსტიკა', 'OBD სკანერი', 'ძრავის ანალიზი', 'შეცდომების წაშლა'],
    description: 'პროფესიონალური დიაგნოსტიკა ყველა ტიპის ავტომობილისთვის. თანამედროვე ტექნოლოგიები და ზუსტი ანალიზი.',
    phone: '+995 555 345 678',
    workingHours: '09:00 - 18:00',
    languages: ['ქართული', 'ინგლისური', 'რუსული'],
    certifications: ['Diagnostic Specialist', 'OBD Expert'],
    portfolio: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=400&auto=format&fit=crop',
    ]
  },
  '4': {
    id: '4',
    name: 'დავით ხარაძე',
    specialty: 'კონდიციონერი',
    rating: 4.7,
    reviews: 73,
    experience: '5 წელი',
    location: 'დიდუბე, თბილისი',
    distance: '3.5 კმ',
    price: '40₾/საათი',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    isAvailable: true,
    services: ['კონდიციონერი', 'გათბობა', 'ვენტილაცია', 'ფილტრები', 'გაზის შევსება'],
    description: 'სპეციალისტი ავტომობილის კლიმატ კონტროლზე. სწრაფი და ხარისხიანი სერვისი. ყველა ტიპის კონდიციონერი.',
    phone: '+995 555 456 789',
    workingHours: '08:00 - 20:00',
    languages: ['ქართული', 'ინგლისური'],
    certifications: ['HVAC Specialist', 'Refrigerant Handling'],
    portfolio: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=400&auto=format&fit=crop',
    ]
  },
  '5': {
    id: '5',
    name: 'თამარ მელაძე',
    specialty: 'საბურავების სპეციალისტი',
    rating: 4.8,
    reviews: 94,
    experience: '7 წელი',
    location: 'ჩუღურეთი, თბილისი',
    distance: '2.9 კმ',
    price: '35₾/საათი',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop',
    isAvailable: true,
    services: ['საბურავების შეცვლა', 'ბალანსირება', 'შეკეთება', 'შენახვა', 'ზამთრის/ზაფხულის'],
    description: 'პროფესიონალური სერვისი საბურავების შეცვლაზე და შენახვაზე. ყველა ზომა და ბრენდი. ზამთრის და ზაფხულის საბურავები.',
    phone: '+995 555 567 890',
    workingHours: '07:00 - 21:00',
    languages: ['ქართული', 'ინგლისური', 'რუსული'],
    certifications: ['Tire Specialist', 'Wheel Alignment Expert'],
    portfolio: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=400&auto=format&fit=crop',
    ]
  }
};

export default function MechanicDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState<'info' | 'portfolio' | 'reviews'>('info');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  
  const mechanic = MECHANICS_DATA[id as string];

  if (!mechanic) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>ხელოსანი ვერ მოიძებნა</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Text style={styles.backButtonText}>უკან დაბრუნება</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleCall = () => {
    Alert.alert(
      'დარეკვა',
      `დარეკვა ${mechanic.name}?`,
      [
        { text: 'გაუქმება', style: 'cancel' },
        { text: 'დარეკვა', onPress: () => Linking.openURL(`tel:${mechanic.phone}`) }
      ]
    );
  };

  const handleMessage = () => {
    Alert.alert(
      'შეტყობინება',
      `შეტყობინების გაგზავნა ${mechanic.name}?`,
      [
        { text: 'გაუქმება', style: 'cancel' },
        { text: 'გაგზავნა', onPress: () => router.push(`/chat/${mechanic.id}`) }
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `შეამოწმეთ ${mechanic.name} - ${mechanic.specialty} ჩემი CarAppX აპლიკაციიდან!`,
        url: `carappx://mechanic/${mechanic.id}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you would typically save to backend
  };

  const handleBookNow = () => {
    Alert.alert(
      'ჯავშნის გაკეთება',
      `გსურთ ${mechanic.name} ჯავშნის გაკეთება?`,
      [
        { text: 'გაუქმება', style: 'cancel' },
        { text: 'ჯავშნა', onPress: () => router.push(`/booking?mechanicId=${mechanic.id}`) }
      ]
    );
  };

  const getSpecialtyColor = (specialty: string) => {
    const colors: { [key: string]: string } = {
      'ელექტრიკოსი': '#6366F1',
      'მექანიკოსი': '#3B82F6',
      'დიაგნოსტიკა': '#22C55E',
      'კონდიციონერი': '#F59E0B',
      'საბურავების სპეციალისტი': '#EF4444',
    };
    return colors[specialty] || '#6B7280';
  };

  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>აღწერა</Text>
        <Text style={styles.description}>{mechanic.description}</Text>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>სერვისები</Text>
        <View style={styles.servicesGrid}>
          {mechanic.services.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Working Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>სამუშაო საათები</Text>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>{mechanic.workingHours}</Text>
        </View>
      </View>

      {/* Languages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ენები</Text>
        <View style={styles.languagesContainer}>
          {mechanic.languages.map((language, index) => (
            <View key={index} style={styles.languageTag}>
              <Text style={styles.languageText}>{language}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Certifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>სერტიფიკატები</Text>
        <View style={styles.certificationsContainer}>
          {mechanic.certifications.map((cert, index) => (
            <View key={index} style={styles.certificationItem}>
              <Ionicons name="ribbon" size={16} color="#F59E0B" />
              <Text style={styles.certificationText}>{cert}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderPortfolioTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.portfolioGrid}>
        {mechanic.portfolio.map((image, index) => (
          <TouchableOpacity key={index} style={styles.portfolioItem}>
            <Image source={{ uri: image }} style={styles.portfolioImage} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.reviewsSummary}>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingNumber}>{mechanic.rating}</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.floor(mechanic.rating) ? "star" : "star-outline"}
                size={20}
                color="#F59E0B"
              />
            ))}
          </View>
          <Text style={styles.reviewsCount}>{mechanic.reviews} მიმოხილვა</Text>
        </View>
      </View>

      {/* Sample Reviews */}
      <View style={styles.reviewsList}>
        <View style={styles.reviewItem}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewerInfo}>
              <View style={styles.reviewerAvatar}>
                <Text style={styles.reviewerInitial}>ა</Text>
              </View>
              <View>
                <Text style={styles.reviewerName}>ალექსანდრე</Text>
                <View style={styles.reviewRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={12} color="#F59E0B" />
                  ))}
                </View>
              </View>
            </View>
            <Text style={styles.reviewDate}>2 დღის წინ</Text>
          </View>
          <Text style={styles.reviewText}>
            ძალიან კარგი სერვისი! სწრაფად და ხარისხიანად გამოასწორა ჩემი მანქანის პრობლემა. რეკომენდაციას ვაძლევ!
          </Text>
        </View>

        <View style={styles.reviewItem}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewerInfo}>
              <View style={styles.reviewerAvatar}>
                <Text style={styles.reviewerInitial}>ნ</Text>
              </View>
              <View>
                <Text style={styles.reviewerName}>ნინო</Text>
                <View style={styles.reviewRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={12} color="#F59E0B" />
                  ))}
                </View>
              </View>
            </View>
            <Text style={styles.reviewDate}>1 კვირის წინ</Text>
          </View>
          <Text style={styles.reviewText}>
            პროფესიონალური მიდგომა და ზუსტი დიაგნოსტიკა. ფასი კი ძალიან გონივრულია.
          </Text>
        </View>
      </View>
    </View>
  );

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const headerOpacityValue = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Hero Section with Parallax */}
      <Animated.View 
        style={[
          styles.heroSection,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacityValue,
          }
        ]}
      >
        <Image source={{ uri: mechanic.avatar }} style={styles.heroBackground} />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.heroOverlay}
        />
        
        {/* Floating Header */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleFavorite} style={styles.headerButton}>
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#EF4444" : "#FFFFFF"} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Ionicons name="share-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Content */}
        <View style={styles.heroContent}>
          <View style={styles.heroAvatarContainer}>
            <Image source={{ uri: mechanic.avatar }} style={styles.heroAvatar} />
            {mechanic.isAvailable && (
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>ხელმისაწვდომი</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.heroName}>{mechanic.name}</Text>
          <View style={[styles.specialtyChip, { backgroundColor: getSpecialtyColor(mechanic.specialty) }]}>
            <Text style={styles.specialtyChipText}>{mechanic.specialty}</Text>
          </View>
          
          <View style={styles.heroStats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.statText}>{mechanic.rating}</Text>
              <Text style={styles.statLabel}>({mechanic.reviews})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color="#FFFFFF" />
              <Text style={styles.statText}>{mechanic.experience}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="location" size={16} color="#FFFFFF" />
              <Text style={styles.statText}>{mechanic.distance}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>ფასი</Text>
            <Text style={styles.priceValue}>{mechanic.price}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.locationText}>{mechanic.location}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.primaryButtonContainer}>
            <TouchableOpacity 
              style={[styles.primaryButton, !mechanic.isAvailable && styles.primaryButtonDisabled]}
              onPress={handleBookNow}
              disabled={!mechanic.isAvailable}
            >
              <LinearGradient
                colors={mechanic.isAvailable ? ['#111827', '#374151'] : ['#E5E7EB', '#D1D5DB']}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>ჯავშნის გაკეთება</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={styles.secondaryButtonsContainer}>
            <TouchableOpacity 
              style={[styles.secondaryButton, !mechanic.isAvailable && styles.secondaryButtonDisabled]}
              onPress={handleCall}
              disabled={!mechanic.isAvailable}
            >
              <Ionicons name="call" size={18} color={mechanic.isAvailable ? "#111827" : "#9CA3AF"} />
              <Text style={[styles.secondaryButtonText, !mechanic.isAvailable && styles.secondaryButtonTextDisabled]}>
                დარეკვა
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, !mechanic.isAvailable && styles.secondaryButtonDisabled]}
              onPress={handleMessage}
              disabled={!mechanic.isAvailable}
            >
              <Ionicons name="chatbubble-outline" size={18} color={mechanic.isAvailable ? "#111827" : "#9CA3AF"} />
              <Text style={[styles.secondaryButtonText, !mechanic.isAvailable && styles.secondaryButtonTextDisabled]}>
                შეტყობინება
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'info' && styles.tabActive]}
            onPress={() => setSelectedTab('info')}
          >
            <Text style={[styles.tabText, selectedTab === 'info' && styles.tabTextActive]}>
              ინფორმაცია
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'portfolio' && styles.tabActive]}
            onPress={() => setSelectedTab('portfolio')}
          >
            <Text style={[styles.tabText, selectedTab === 'portfolio' && styles.tabTextActive]}>
              პორტფოლიო
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'reviews' && styles.tabActive]}
            onPress={() => setSelectedTab('reviews')}
          >
            <Text style={[styles.tabText, selectedTab === 'reviews' && styles.tabTextActive]}>
              მიმოხილვები
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {selectedTab === 'info' && renderInfoTab()}
        {selectedTab === 'portfolio' && renderPortfolioTab()}
        {selectedTab === 'reviews' && renderReviewsTab()}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  heroSection: {
    height: 400,
    position: 'relative',
  },
  heroBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  availableBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  availableText: {
    fontSize: 10,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  heroName: {
    fontSize: 22,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  specialtyChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  specialtyChipText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'NotoSans_500Medium',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8FAFC',
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#1F2937',
  },
  priceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  primaryButtonContainer: {
    marginBottom: 12,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#374151',
  },
  secondaryButtonTextDisabled: {
    color: '#9CA3AF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    lineHeight: 22,
  },
  servicesGrid: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#1F2937',
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  languageText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  certificationsContainer: {
    gap: 12,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  certificationText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#1F2937',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  portfolioItem: {
    width: (width - 64) / 2,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  reviewsSummary: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 28,
    fontFamily: 'NotoSans_700Bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  reviewsCount: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitial: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#FFFFFF',
  },
  reviewerName: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#1F2937',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  reviewText: {
    fontSize: 13,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
  },
});
