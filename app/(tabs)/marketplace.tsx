import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser } from '../../contexts/UserContext';

const { width } = Dimensions.get('window');

const MAIN_CATEGORIES = [
  {
    id: 'parts',
    title: 'ავტონაწილები',
    subtitle: 'ზეთები, საბურავები, ფილტრები',
    icon: 'cog-outline',
    color: '#3B82F6',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'mechanics',
    title: 'ხელოსნები',
    subtitle: 'ელექტრიკოსები, მექანიკოსები',
    icon: 'build-outline',
    color: '#10B981',
    image: 'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'services',
    title: 'ავტოსერვისები',
    subtitle: 'დეტეილინგი, სამრეცხაო, სერვისი',
    icon: 'star-outline',
    color: '#F59E0B',
    image: 'https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'towing',
    title: 'ევაკუატორი',
    subtitle: '24/7 გადაყვანა, ღამის სერვისი',
    icon: 'car-outline',
    color: '#EF4444',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=400&auto=format&fit=crop',
  },
];

const FEATURED_SERVICES = [
  {
    id: '1',
    title: 'BMW ორიგინალი ნაწილები',
    description: 'ორიგინალური ნაწილები E90, F30 სერიებისთვის',
    price: '45₾-დან',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop',
    rating: 4.8,
    verified: true,
  },
  {
    id: '2',
    title: 'პრემიუმ ავტო დეტეილინგი',
    description: 'სრული დეტეილინგი ყველა ტიპის ავტომობილისთვის',
    price: '120₾',
    image: 'https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?q=80&w=600&auto=format&fit=crop',
    rating: 4.9,
    verified: true,
  },
];

const FeaturedSkeleton = () => {
  return (
    <View style={styles.featureCardSkeleton}>
      <View style={styles.featureImageSkeleton} />
      <View style={styles.featureContentSkeleton}>
        <View style={styles.featureLineSkeleton} />
        <View style={[styles.featureLineSkeleton, { width: '40%' }]} />
      </View>
    </View>
  );
};

export default function MarketplaceScreen() {
  const { user } = useUser();
  const router = useRouter();
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const COMING_SOON = new Set(['mechanics', 'services', 'towing']);

  const handleCategoryPress = (categoryId: string) => {
    if (COMING_SOON.has(categoryId)) {
      Alert.alert('მალე იქნება ხელმისაწვდომი', 'ეს სექცია მუშაობის პროცესშია \u2013 მალე დაემატება!');
      return;
    }
    switch (categoryId) {
      case 'mechanics':
        router.push('/mechanics');
        break;
      case 'parts':
        router.push('/parts');
        break;
      case 'services':
        router.push('/carwash');
        break;
      case 'towing':
        router.push('/offers');
        break;
      default:
        break;
    }
  };

  const renderCategoryCard = (category: any, index: number) => {
    const isComingSoon = COMING_SOON.has(category.id);
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.compactCard, isComingSoon && styles.cardDisabled]}
        onPress={() => handleCategoryPress(category.id)}
        activeOpacity={0.8}
      >
        {isComingSoon && (
          <View style={styles.comingSoonPill}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={styles.comingSoonText}>მალე</Text>
          </View>
        )}
        <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
          <Ionicons name={category.icon as any} size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.compactTitle}>{category.title}</Text>
        <Text style={styles.compactSubtitle}>{category.subtitle}</Text>
      </TouchableOpacity>
    );
  };

  const renderFeaturedCard = (item: any, index: number) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.featureCard} 
      activeOpacity={0.95}
      onPress={() => {
        // Featured services navigation based on title
        if (item.title.includes('ნაწილები')) {
          router.push('/parts');
        } else if (item.title.includes('დეტეილინგი')) {
          router.push('/carwash');
        } else {
          router.push('/details');
        }
      }}
    >
      <Image source={{ uri: item.image }} style={styles.featureImage} />
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.65)"]}
        style={styles.featureOverlay}
      />
      <View style={styles.featureBadgesRow}>
        <View style={styles.badgePillPrimary}><Text style={styles.badgePillPrimaryText}>რეკომენდირებული</Text></View>
        {item.verified && (
          <View style={styles.badgePillLight}><Ionicons name="checkmark-circle" size={14} color="#10B981" /><Text style={styles.badgePillLightText}>ვერიფიცირებული</Text></View>
        )}
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.featureMetaRow}>
          <View style={styles.featureRating}><Ionicons name="star" size={14} color="#F59E0B" /><Text style={styles.featureRatingText}>{item.rating}</Text></View>
          <View style={styles.pricePill}><Text style={styles.pricePillText}>{item.price}</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Hero Header */}
      <SafeAreaView style={styles.heroSection}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.heroTitle}>მაღაზია</Text>
            <Text style={styles.heroSubtitle}>
              ყველაფერი რაც თქვენს ავტომობილს სჭირდება
            </Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Hero Promo Banner */}
      <View style={styles.heroPromoContainer}>
        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.heroPromo}
          onPress={() => router.push('/details')}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe0?q=80&w=1600&auto=format&fit=crop' }}
            style={styles.heroPromoBackground}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.65)"]}
            style={styles.heroPromoOverlay}
          />

          {/* Floating top-right pill */}
          <View style={styles.heroPromoTopRow}>
            <View style={styles.heroPromoPillLight}>
              <Ionicons name="sparkles" size={14} color="#10B981" />
              <Text style={styles.heroPromoPillLightText}>პრივილეგირებული შეთავაზება</Text>
            </View>
            <View style={styles.heroPromoDiscount}>
              <Text style={styles.heroPromoDiscountText}>-25%</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.heroPromoContent}>
            <View style={{ gap: 6 }}>
              <Text style={styles.heroPromoTitle}>პრემიუმ მოვლა შენი ავტომობილისთვის</Text>
              <Text style={styles.heroPromoSubtitle}>სუფთა, სწრაფი და ტექნოლოგიური სერვისი ახლოს შენთან</Text>
            </View>

            <View style={styles.heroPromoFooter}>
              <View style={styles.heroPromoFeatures}>
                <View style={styles.heroPromoFeature}><Ionicons name="checkmark-circle" size={16} color="#22C55E" /><Text style={styles.heroPromoFeatureText}>Quality</Text></View>
                <View style={styles.heroPromoFeature}><Ionicons name="time" size={16} color="#22C55E" /><Text style={styles.heroPromoFeatureText}>Fast</Text></View>
                <View style={styles.heroPromoFeature}><Ionicons name="shield-checkmark" size={16} color="#22C55E" /><Text style={styles.heroPromoFeatureText}>Safe</Text></View>
              </View>
              <View style={styles.heroPromoButton}>
                <Text style={styles.heroPromoButtonText}>გაიგე მეტი</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>კატეგორიები</Text>
          <View style={styles.compactGrid}>
            {MAIN_CATEGORIES.map((category, index) => renderCategoryCard(category, index))}
          </View>
        </View>

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>რეკომენდირებული</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>ყველა</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featureCarousel}
            snapToInterval={Math.round(width * 0.8) + 14}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {/* Skeletons while loading */}
            {/* Replace with loading state when wired to API */}
            {FEATURED_SERVICES.length === 0 && [1,2].map((i) => <FeaturedSkeleton key={`sk-${i}`} />)}
            {FEATURED_SERVICES.map((item, index) => renderFeaturedCard(item, index))}
          </ScrollView>
        </View>

        {/* Quick Actions removed per request */}

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
  
  // Hero Section
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 22,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  content: {
    flex: 1,
  },

  // Categories Section
  categoriesSection: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  compactCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  comingSoonPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comingSoonText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  compactSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Featured Section
  featuredSection: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  miniCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  miniImage: {
    width: '100%',
    height: 80,
  },
  miniContent: {
    padding: 12,
  },
  miniTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  miniMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniRatingText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  miniPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  miniVerified: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 3,
  },

  // Featured revamped styles
  featureCarousel: {
    paddingLeft: 20,
    paddingRight: 6,
    gap: 14,
  },
  featureCard: {
    width: Math.round(width * 0.8),
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  // Hero promo banner styles
  heroPromoContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroPromo: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0B0F1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  heroPromoBackground: { width: '100%', height: '100%', position: 'absolute' },
  heroPromoOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  heroPromoTopRow: { position: 'absolute', left: 12, right: 12, top: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroPromoPillLight: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  heroPromoPillLightText: { color: '#111827', fontSize: 12, fontWeight: '700' },
  heroPromoDiscount: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  heroPromoDiscountText: { color: '#FFFFFF', fontWeight: '800' },
  heroPromoContent: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 12 },
  heroPromoTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  heroPromoSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  heroPromoFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroPromoFeatures: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroPromoFeature: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  heroPromoFeatureText: { color: '#E5E7EB', fontWeight: '700', fontSize: 11 },
  heroPromoButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  heroPromoButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  featureImage: { width: '100%', height: '100%' },
  featureOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  featureBadgesRow: { position: 'absolute', left: 12, right: 12, top: 12, flexDirection: 'row', gap: 8 },
  badgePillPrimary: { backgroundColor: 'rgba(59,130,246,0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgePillPrimaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  badgePillLight: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  badgePillLightText: { color: '#111827', fontSize: 11, fontWeight: '700' },
  featureContent: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  featureTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8 },
  featureMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featureRating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureRatingText: { color: '#FDE68A', fontWeight: '700' },
  pricePill: { backgroundColor: 'rgba(17,24,39,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  pricePillText: { color: '#FFFFFF', fontWeight: '700' },

  // Skeletons
  featureCardSkeleton: {
    width: Math.round(width * 0.8),
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  featureImageSkeleton: { flex: 1, backgroundColor: '#E5E7EB' },
  featureContentSkeleton: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  featureLineSkeleton: { height: 12, backgroundColor: '#D1D5DB', borderRadius: 6, marginBottom: 8, width: '70%' },

  // Quick Actions
  quickSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
  },
  quickText: {
    fontSize: 11,
    fontWeight: '600',
  },
});