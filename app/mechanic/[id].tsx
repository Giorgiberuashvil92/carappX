import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { mechanicsApi, MechanicDTO } from '@/services/mechanicsApi';

export default function MechanicDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<MechanicDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const mech = id ? await mechanicsApi.getMechanicById(String(id)) : null;
        setData(mech);
      } catch (e) {
        setError('დეტალების ჩატვირთვა ვერ მოხერხდა');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const img = data?.avatar || 'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=1200&auto=format&fit=crop';
  const services = data?.services || [];
  const [tab, setTab] = useState<'projects' | 'reviews'>('projects');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.heroWrap}>
            <Image source={{ uri: img }} style={styles.hero} />
            <View style={styles.heroTopRow}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color="#111827" />
              </TouchableOpacity>
            </View>
            {data && (
              <View style={styles.heroBadges}>
                <View style={[styles.badge, data.isAvailable ? styles.badgeGreen : styles.badgeRed]}>
                  <View style={styles.dot} />
                  <Text style={styles.badgeText}>{data.isAvailable ? 'ხელმისაწვდომი' : 'დაკავებული'}</Text>
                </View>
                {typeof data.rating === 'number' && (
                  <View style={styles.ratingLight}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingLightText}>{data.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {loading ? (
            <View style={styles.center}><ActivityIndicator color="#6366F1" size="large" /></View>
          ) : error ? (
            <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
          ) : !data ? (
            <View style={styles.center}><Text style={styles.error}>ჩანაწერი ვერ მოიძებნა</Text></View>
          ) : (
            <View style={{ paddingHorizontal: 16, gap: 16 }}>
              <View style={styles.headerBlock}>
                <Text style={styles.title}>{data.name}</Text>
                <Text style={styles.sub}>{data.specialty}</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ლოკაცია</Text>
                  <Text style={styles.infoValue}>{data.location || '-'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ტელეფონი</Text>
                  <Text style={styles.infoValue}>{(data as any).phone || '-'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ექსპერტიზა</Text>
                  <Text style={styles.infoValue}>{(data as any).experience || '-'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ფასი</Text>
                  <Text style={styles.infoValue}>{data.priceGEL ? `₾${data.priceGEL}/სთ` : '-'}</Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text style={styles.sectionTitle}>სერვისები</Text>
                {services.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {services.map((s, i) => (
                      <View key={`${s}-${i}`} style={styles.tag}>
                        <Text style={styles.tagText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.muted}>არ აქვს</Text>
                )}
              </View>

              <View style={{ gap: 8 }}>
                <Text style={styles.sectionTitle}>აღწერა</Text>
                {(data as any).description ? (
                  <Text style={styles.desc}>{(data as any).description}</Text>
                ) : (
                  <Text style={styles.muted}>არ აქვს</Text>
                )}
              </View>

              {/* Tabs */}
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'projects' && styles.tabBtnActive]}
                  onPress={() => setTab('projects')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, tab === 'projects' && styles.tabTextActive]}>ნამუშევრები</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'reviews' && styles.tabBtnActive]}
                  onPress={() => setTab('reviews')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, tab === 'reviews' && styles.tabTextActive]}>მიმოხილვები</Text>
                </TouchableOpacity>
              </View>

              {tab === 'projects' ? (
                <View style={{ gap: 8 }}>
                  {Array.isArray((data as any).projects) && (data as any).projects.length > 0 ? (
                    <View style={styles.projectsGrid}>
                      {((data as any).projects as Array<{ image?: string; title?: string }>).map((p, idx) => (
                        <View key={`prj-${idx}`} style={styles.projectCard}>
                          {p?.image ? (
                            <Image source={{ uri: p.image }} style={styles.projectImage} />
                          ) : (
                            <View style={[styles.projectImage, { backgroundColor: '#F3F4F6' }]} />
                          )}
                          {p?.title ? <Text numberOfLines={1} style={styles.projectTitle}>{p.title}</Text> : null}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.muted}>არ აქვს</Text>
                  )}
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {Array.isArray((data as any).reviews) && (data as any).reviews.length > 0 ? (
                    <View style={{ gap: 10 }}>
                      {((data as any).reviews as Array<{ user?: string; rating?: number; comment?: string; date?: string }>).map((r, idx) => (
                        <View key={`rev-${idx}`} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <Text style={styles.reviewUser}>{r.user || 'მომხმარებელი'}</Text>
                            <View style={styles.reviewStars}>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Ionicons key={i} name={i < (r.rating || 0) ? 'star' : 'star-outline'} size={12} color="#F59E0B" />
                              ))}
                            </View>
                          </View>
                          {r.comment ? <Text style={styles.reviewText}>{r.comment}</Text> : null}
                          {r.date ? <Text style={styles.reviewDate}>{r.date}</Text> : null}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.muted}>არ აქვს</Text>
                  )}
                </View>
              )}

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.btnPrimary}>
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                  <Text style={styles.btnPrimaryText}>დარეკვა</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary}>
                  <Ionicons name="chatbubble-ellipses" size={18} color="#374151" />
                  <Text style={styles.btnSecondaryText}>წერა</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  heroWrap: { width: '100%', height: 220, position: 'relative', backgroundColor: '#F3F4F6' },
  hero: { width: '100%', height: '100%' },
  heroTopRow: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  heroBadges: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.9)' },
  badgeRed: { backgroundColor: 'rgba(239,68,68,0.9)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ratingLight: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  ratingLightText: { color: '#111827', fontSize: 12, fontWeight: '800' },
  center: { padding: 24, alignItems: 'center' },
  error: { color: '#DC2626', fontSize: 14 },
  headerBlock: { gap: 4 },
  title: { color: '#111827', fontSize: 20, fontWeight: '800' },
  sub: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoItem: { width: '48%', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
  infoLabel: { color: '#6B7280', fontSize: 11, fontWeight: '600' },
  infoValue: { color: '#111827', fontSize: 13, fontWeight: '700' },
  sectionTitle: { color: '#111827', fontSize: 15, fontWeight: '800' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  tagText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  desc: { color: '#374151', fontSize: 13, lineHeight: 20 },
  muted: { color: '#9CA3AF', fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  btnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#4F46E5' },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '800' },
  btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  btnSecondaryText: { color: '#374151', fontWeight: '800' },
  projectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  projectCard: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  projectImage: { width: '100%', height: 120 },
  projectTitle: { color: '#111827', fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 8 },
  reviewCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, gap: 6 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewUser: { color: '#111827', fontSize: 13, fontWeight: '800' },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reviewText: { color: '#374151', fontSize: 12 },
  reviewDate: { color: '#9CA3AF', fontSize: 10 },
  tabsRow: { flexDirection: 'row', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  tabText: { color: '#6B7280', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#111827' },
});


