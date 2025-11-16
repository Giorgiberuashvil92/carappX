import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export type FeatureItem = { icon: any; label: string };
export type ServiceItem = { name: string; price: string; duration?: string; tags?: string[] };
export type PackageItem = { name: string; price: string; includes: string[]; highlight?: boolean };
export type ReviewItem = { user: string; stars: number; text: string; photos?: string[] };

export type DetailViewProps = {
  id: string;
  title: string;
  coverImage?: string;
  rating?: { value: number; count?: number };
  distance?: string;
  eta?: string;
  isOpen?: boolean;
  price?: { from?: string; currency?: string };
  vendor?: { name?: string; phone?: string; location?: { address?: string; lat?: number; lng?: number }; badges?: string[] };
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
};

export default function DetailView(props: DetailViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const amountFromPackages = useMemo(() => {
    const p = props.sections?.packages?.[0]?.price || props.price?.from || '';
    const num = parseInt(String(p).replace(/[^0-9]/g, ''));
    return isNaN(num) ? undefined : num;
  }, [props.sections, props.price]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: props.coverImage || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200' }}
        style={styles.hero}
        resizeMode="cover"
      >
        <SafeAreaView>
          <View style={[styles.headerBar, { paddingTop: insets.top  }]}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={18} color="#111827" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.iconBtn} onPress={props.actions?.onShare}>
                <Ionicons name="share-social" size={16} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="heart-outline" size={16} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <ScrollView contentContainerStyle={{ paddingBottom: (props.flags?.stickyCTA ? 100 : 24) + Math.max(insets.bottom, 12) }}>
        <View style={styles.block}>
          <Text style={styles.title}>{props.title}</Text>
          <View style={styles.metaRow}>
            {props.rating?.value !== undefined && (
              <View style={styles.metaChip}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.metaText}>{props.rating.value.toFixed(1)}{props.rating.count ? ` (${props.rating.count})` : ''}</Text>
              </View>
            )}
            {props.distance && (
              <View style={styles.metaChip}>
                <Ionicons name="location" size={14} color="#3B82F6" />
                <Text style={styles.metaText}>{props.distance}</Text>
              </View>
            )}
            {props.eta && (
              <View style={styles.metaChip}>
                <Ionicons name="time" size={14} color="#10B981" />
                <Text style={styles.metaText}>{props.eta}</Text>
              </View>
            )}
          </View>
        </View>

        {props.sections?.description && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={18} color="#3B82F6" />
              <Text style={styles.cardTitle}>აღწერა</Text>
            </View>
            <Text style={styles.description}>{props.sections.description}</Text>
          </View>
        )}

        {props.sections?.services && props.sections.services.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="construct" size={18} color="#3B82F6" />
              <Text style={styles.cardTitle}>სერვისები</Text>
            </View>
            {props.sections.services.map((s, idx) => (
              <View key={idx} style={[styles.serviceRow, idx < props.sections!.services!.length - 1 && styles.serviceDivider]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={styles.serviceIcon}><Ionicons name="build" size={14} color="#3B82F6" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{s.name}</Text>
                    {!!s.duration && <Text style={styles.serviceMeta}>⏱ {s.duration}</Text>}
                  </View>
                </View>
                <Text style={styles.price}>{s.price}</Text>
              </View>
            ))}
          </View>
        )}

        {props.sections?.packages && props.sections.packages.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube" size={18} color="#3B82F6" />
              <Text style={styles.cardTitle}>პაკეტები</Text>
            </View>
            <View style={{ gap: 10 }}>
              {props.sections.packages.map((p, idx) => (
                <View key={idx} style={[styles.packageRow, p.highlight && styles.packageHighlight]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.packageName}>{p.name}</Text>
                    <Text style={styles.packageIncludes}>{p.includes.join(' • ')}</Text>
                  </View>
                  <Text style={styles.packagePrice}>{p.price}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {props.sections?.features && props.sections.features.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={18} color="#3B82F6" />
              <Text style={styles.cardTitle}>ფუნქციები</Text>
            </View>
            <View style={styles.featuresWrap}>
              {props.sections.features.map((f, idx) => (
                <View key={idx} style={styles.featurePill}>
                  <Ionicons name={f.icon as any} size={14} color="#6B7280" />
                  <Text style={styles.featureText}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubbles" size={18} color="#3B82F6" />
            <Text style={styles.cardTitle}>რევიუები</Text>
          </View>
          <Text style={{ color: '#6B7280', fontSize: 13 }}>მალე დაემატება…</Text>
        </View>
      </ScrollView>

      {props.flags?.stickyCTA && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View>
            <Text style={styles.priceLabel}>საწყისი ფასი</Text>
            <Text style={styles.totalPrice}>{props.price?.from || '-'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={props.actions?.onCall} style={styles.circleBtn}>
              <Ionicons name="call" size={16} color="#111827" />
            </TouchableOpacity>
            {props.flags?.showFinance && (
              <TouchableOpacity onPress={() => props.actions?.onFinance?.(amountFromPackages)} style={styles.secondaryBtn}>
                <Ionicons name="card" size={14} color="#111827" />
                <Text style={styles.secondaryText}>განვადება</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={props.actions?.onBook} style={styles.primaryBtn}>
              <Ionicons name="calendar" size={14} color="#FFFFFF" />
              <Text style={styles.primaryText}>დაჯავშნა</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { width: '100%', height: height * 0.3 },
  headerBar: { paddingHorizontal: 16, paddingTop: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },

  block: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  metaText: { fontSize: 12, color: '#111827', fontWeight: '600' },

  card: { marginTop: 12, marginHorizontal: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  description: { fontSize: 14, color: '#374151', lineHeight: 20 },

  serviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  serviceDivider: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  serviceIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  serviceMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  price: { fontSize: 15, fontWeight: '800', color: '#3B82F6' },

  featuresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  featureText: { fontSize: 12, color: '#374151', fontWeight: '600' },

  packageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12 },
  packageHighlight: { backgroundColor: '#F8FAFF', borderColor: '#BFDBFE' },
  packageName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  packageIncludes: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  packagePrice: { fontSize: 15, fontWeight: '900', color: '#111827' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 11, color: '#6B7280' },
  totalPrice: { fontSize: 20, fontWeight: '900', color: '#111827' },
  circleBtn: { width: 44, height: 44, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  secondaryText: { color: '#111827', fontWeight: '800', fontSize: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});


