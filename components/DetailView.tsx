import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image, Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import ImageViewing from 'react-native-image-viewing';

const { height } = Dimensions.get('window');

export type FeatureItem = { icon: any; label: string };
export type ServiceItem = { name: string; price: string; duration?: string; tags?: string[] };
export type PackageItem = { name: string; price: string; includes: string[]; highlight?: boolean };
export type ReviewItem = { user: string; stars: number; text: string; photos?: string[] };

export type DetailViewProps = {
  id: string;
  title: string;
  coverImage?: string;
  images?: string[]; // Array of images for slider
  rating?: { value: number; count?: number };
  distance?: string;
  eta?: string;
  isOpen?: boolean;
  price?: { from?: string; currency?: string };
  vendor?: { name?: string; phone?: string; location?: { address?: string; lat?: number; lng?: number }; badges?: string[] };
  serviceType?: string; // Service type: 'carwash', 'store', 'mechanic', etc.
  sections?: {
    description?: string;
    features?: FeatureItem[];
    services?: ServiceItem[];
    packages?: PackageItem[];
    reviews?: ReviewItem[];
  };
  actions?: {
    onBook?: () => void;
    onCall?: () => void;
    onChat?: () => void;
    onFinance?: (amount?: number) => void;
    onShare?: () => void;
  };
  flags?: { showFinance?: boolean; showMapPreview?: boolean; stickyCTA?: boolean; enableTabs?: boolean };
  onClose?: () => void; // Optional callback for closing modal
};

export default function DetailView(props: DetailViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Ensure insets have default values to avoid undefined issues
  const safeInsets = {
    top: insets.top ?? 0,
    bottom: insets.bottom ?? 0,
    left: insets.left ?? 0,
    right: insets.right ?? 0,
  };
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  
  const amountFromPackages = useMemo(() => {
    const p = props.sections?.packages?.[0]?.price || props.price?.from || '';
    const num = parseInt(String(p).replace(/[^0-9]/g, ''));
    return isNaN(num) ? undefined : num;
  }, [props.sections, props.price]);

  // Prepare images array
  const images = useMemo(() => {
    if (props.images && props.images.length > 0) {
      return props.images;
    }
    if (props.coverImage) {
      return [props.coverImage];
    }
    return ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200'];
  }, [props.images, props.coverImage]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentImageIndex(roundIndex);
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroContainer}>
        {images.length > 1 ? (
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyExtractor={(item, index) => `image-${index}`}
            renderItem={({ item }) => (
              <ImageBackground
                source={{ uri: item }}
                style={styles.hero}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                  style={StyleSheet.absoluteFill}
                />
              </ImageBackground>
            )}
          />
        ) : (
          <ImageBackground
            source={{ uri: images[0] }}
            style={styles.hero}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
        )}
        
        {/* Image indicators */}
        {images.length > 1 ? (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
        ) : null}
        <SafeAreaView style={StyleSheet.absoluteFillObject}>
          <View style={[styles.headerBar, { paddingTop: safeInsets.top + 8 }]}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => {
                if (props.onClose) {
                  props.onClose();
                } else {
                  router.back();
                }
              }}
              activeOpacity={0.8}
            >
              <BlurView intensity={80} style={styles.glassBtn}>
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </BlurView>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerIconBtn} 
                onPress={props.actions?.onShare}
                activeOpacity={0.8}
              >
                <BlurView intensity={80} style={styles.glassBtn}>
                  <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerIconBtn}
                activeOpacity={0.8}
              >
                <BlurView intensity={80} style={styles.glassBtn}>
                  <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: (props.flags?.stickyCTA ? 90 : 24) + Math.max(safeInsets.bottom, 12) }}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{props.title}</Text>
          </View>
          
          <View style={styles.metaRow}>
            {props.rating?.value !== undefined ? (
              <BlurView intensity={20} style={styles.metaChip}>
                <Ionicons name="star" size={12} color="#000000" />
                <Text style={styles.metaText}>{props.rating.value.toFixed(1)}</Text>
                {props.rating.count ? (
                  <Text style={styles.metaCount}>({props.rating.count})</Text>
                ) : null}
              </BlurView>
            ) : null}
            {props.distance ? (
              <BlurView intensity={20} style={styles.metaChip}>
                <Ionicons name="location-outline" size={12} color="#000000" />
                <Text style={styles.metaText}>{props.distance}</Text>
              </BlurView>
            ) : null}
            {props.eta ? (
              <BlurView intensity={20} style={styles.metaChip}>
                <Ionicons name="time-outline" size={12} color="#000000" />
                <Text style={styles.metaText}>{props.eta}</Text>
              </BlurView>
            ) : null}
          </View>
        </View>
        
        {props.sections?.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>აღწერა</Text>
            <BlurView intensity={20} style={styles.glassCard}>
              <Text style={styles.description}>{props.sections.description}</Text>
            </BlurView>
          </View>
        ) : null}

        {props.sections?.features && props.sections.features.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ფუნქციები</Text>
            <View style={styles.featuresGrid}>
              {props.sections.features.map((f, idx) => (
                <BlurView key={idx} intensity={20} style={styles.featureItem}>
                  <Ionicons name={f.icon as any} size={16} color="#000000" />
                  <Text style={styles.featureText}>{f.label}</Text>
                </BlurView>
              ))}
            </View>
          </View>
        ) : null}

        {/* Gallery Section */}
        {images && images.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>გალერეა</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryContainer}
            >
              {images.map((imageUri, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.galleryItem}
                  activeOpacity={0.9}
                  onPress={() => {
                    setGalleryImageIndex(index);
                    setGalleryVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      {/* Image Viewer */}
      <ImageViewing
        images={images.map(uri => ({ uri }))}
        imageIndex={galleryImageIndex}
        visible={galleryVisible}
        onRequestClose={() => setGalleryVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />

      {props.flags?.stickyCTA ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(safeInsets.bottom, 12) }]}>
          <View style={styles.bottomBarContent}>
            <View style={styles.actionButtons}>
              {props.vendor?.phone && props.vendor.phone.trim() !== '' && props.actions?.onCall ? (
                <TouchableOpacity 
                  onPress={props.actions.onCall} 
                  style={styles.callBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.callText}>დარეკვა</Text>
                </TouchableOpacity>
              ) : null}
              {props.actions?.onFinance && props.flags?.showFinance ? (
                <TouchableOpacity 
                  onPress={() => props.actions?.onFinance?.(amountFromPackages)} 
                  style={styles.financeBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="card-outline" size={16} color="#111827" />
                  <Text style={styles.financeText}>განვადება</Text>
                </TouchableOpacity>
              ) : null}
              {props.actions?.onBook && props.serviceType === 'carwash' ? (
                <TouchableOpacity 
                  onPress={props.actions.onBook} 
                  style={styles.bookBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bookText}>დაჯავშნა</Text>
                </TouchableOpacity>
              ) : null}
              {/* For non-carwash types, show book button that calls onBook (which will call phone) */}
              {props.actions?.onBook && props.serviceType !== 'carwash' ? (
                <TouchableOpacity 
                  onPress={props.actions.onBook} 
                  style={styles.bookBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bookText}>კონტაქტი</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  heroContainer: {
    width: '100%',
    height: height * 0.38,
    position: 'relative',
  },
  hero: { 
    width: Dimensions.get('window').width,
    height: height * 0.38,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  indicatorActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  headerBar: { 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassBtn: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },

  contentWrapper: { 
    paddingHorizontal: 20, 
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  titleSection: {
    marginTop: 14,
    marginBottom: 14,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 6,
    lineHeight: 24,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  metaRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 10, 
    marginBottom: 14,
  },
  metaChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    paddingHorizontal: 10, 
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  metaText: { 
    fontSize: 11, 
    color: '#000000', 
    fontWeight: '600' 
  },
  metaCount: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  contactBtn: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  glassContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  glassCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  description: { 
    fontSize: 13, 
    color: '#333333', 
    lineHeight: 20,
  },

  servicesList: {
    gap: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  serviceDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#000000',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#000000',
    marginBottom: 3,
  },
  serviceMeta: { 
    fontSize: 11, 
    color: '#666666',
  },
  servicePrice: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#000000' 
  },

  packagesList: {
    gap: 10,
  },
  packageCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  packageCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  packageHighlight: {
    borderColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1.5,
  },
  packageContent: {
    flex: 1,
    marginBottom: 10,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  packageName: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#000000',
  },
  packageBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  packageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  packageIncludesWrapper: {
    gap: 6,
  },
  packageIncludeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  packageIncludes: { 
    fontSize: 12, 
    color: '#333333',
  },
  packagePrice: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#000000',
    textAlign: 'right',
  },

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    minWidth: '45%',
  },
  featureText: { 
    fontSize: 12, 
    color: '#000000', 
    fontWeight: '600' 
  },

  bottomBar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomBarContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: { 
    fontSize: 11, 
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  totalPrice: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#111827',
    letterSpacing: -0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  callText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  financeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  financeText: { 
    color: '#111827', 
    fontWeight: '700', 
    fontSize: 13,
  },
  bookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111827',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 14,
  },
  galleryContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  galleryItem: {
    width: 280,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
});


