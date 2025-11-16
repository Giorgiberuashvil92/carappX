import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, TextInput, ActivityIndicator, Dimensions, Modal, Switch, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { mechanicsApi, MechanicDTO } from '@/services/mechanicsApi';
import photoService from '@/services/photoService';

const { width } = Dimensions.get('window');
const GAP = 16;
const CARD_WIDTH = (width - GAP * 3) / 2; // 2-cols grid with 16px paddings

type SortKey = 'recommended' | 'rating' | 'price' | 'name';
const SPECIALTIES: string[] = [
  'ზოგადი სერვისი',
  'კომპიუტერული დიაგნოსტიკა',
  'ძრავი (ტაიმინგი/ზეთის სისტემა)',
  'გადაცემათა კოლოფი (ავტომატი)',
  'გადაცემათა კოლოფი (მექანიკა)',
  'სავალი ნაწილი / ამორტიზატორი',
  'მუხრუჭები',
  'გაგრილების სისტემა (რადიატორი/ტუმბო)',
  'საწვავის სისტემა (ინჟექტორი/ტუმბო)',
  'ავტოელექტრიკა / ელექტრონიკა',
  'სტარტერი / გენერატორი',
  'კონდიციონერი / კლიმატი',
  'გამონაბოლქვი / გამომშვები სისტემა',
  'საბურავები / დაბალანსება / ვულკანიზაცია',
  'კუზავი / ფერწერა / შედუღება',
  'დეტეილინგი / ანტიკოროზია',
];

export default function MechanicsScreen() {
  const router = useRouter();
  const [mechanics, setMechanics] = useState<MechanicDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('recommended');
  const [specialty, setSpecialty] = useState<string>('');

  // Add mechanic modal state
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  // Filter modal state
  const [showFilter, setShowFilter] = useState(false);
  const [filterSpec, setFilterSpec] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    location: '',
    phone: '',
    address: '',
    avatar: '',
    servicesCsv: '',
    isAvailable: true,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { q?: string; specialty?: string } = {};
      if (debounced.trim()) params.q = debounced.trim();
      if (specialty) params.specialty = specialty;
      const data = await mechanicsApi.getMechanics(params);
      setMechanics(data);
    } catch (e) {
      console.error(e);
      setError('მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debounced, specialty]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sorted = useMemo(() => {
    const list = [...mechanics];
    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'price') {
      list.sort((a, b) => (a.priceGEL ?? Infinity) - (b.priceGEL ?? Infinity));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return list;
  }, [mechanics, sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderCard = ({ item }: { item: MechanicDTO }) => {
    const img = item.avatar || 'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=600&auto=format&fit=crop';
    const topServices = (item.services || []).slice(0, 2);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => router.push(`/mechanic/${item.id}`)}>
        <View style={styles.cardImageWrap}>
          <Image source={{ uri: img }} style={styles.cardImage} />
          <View style={styles.badgeRow}>
            <View style={[styles.badge, item.isAvailable ? styles.badgeGreen : styles.badgeRed]}>
              <View style={styles.dot} />
              <Text style={styles.badgeText}>{item.isAvailable ? 'ხელმისაწვდომი' : 'დაკავებული'}</Text>
            </View>
            {typeof item.rating === 'number' && (
              <View style={styles.ratingLight}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingLightText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
          <View style={styles.rowBetween}>
            <Text numberOfLines={1} style={styles.sub}>{item.specialty || 'სპეციალობა'}</Text>
            {item.priceGEL ? (
              <View style={styles.pricePill}>
                <Text style={styles.pricePillText}>₾{item.priceGEL}/სთ</Text>
              </View>
            ) : null}
          </View>
          {topServices.length > 0 && (
            <View style={styles.tagsRow}>
              {topServices.map((s, i) => (
                <View key={`${s}-${i}`} style={styles.tag}>
                  <Text numberOfLines={1} style={styles.tagText}>{s}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.rowCenter}>
            <Ionicons name="location" size={12} color="#6B7280" />
            <Text numberOfLines={1} style={styles.meta}>{item.location || 'თბილისი'}</Text>
            </View>
          </View>
        </TouchableOpacity>
    );
  };

  const header = (
    <View>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
            </TouchableOpacity>
        <Text style={styles.title}>ხელოსნები</Text>
        <TouchableOpacity style={styles.headerAddBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={16} color="#111827" />
          <Text style={styles.headerAddBtnText}>ხელოსნად დამატება</Text>
            </TouchableOpacity>
          </View>
      <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
          style={styles.input}
          placeholder="ძიება სახელით ან სპეციალობით"
                placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
              />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
        ) : null}
          </View>
      <View style={styles.controlsRow}>
        <View style={{ flex: 1 }}>
          <FlatList
            data={["ყველა", ...SPECIALTIES]}
            keyExtractor={(i) => i}
          horizontal
          showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pill,
                  (item === 'ყველა' ? !specialty : specialty === item) && styles.pillActive,
                ]}
                onPress={() => setSpecialty(item === 'ყველა' ? '' : item)}
              >
                <Text style={[styles.pillText, (item === 'ყველა' ? !specialty : specialty === item) && styles.pillTextActive]}>
                  {item}
                  </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={styles.actionsCol}>
            <TouchableOpacity 
            style={[styles.pillSm, styles.pillAccent]}
            onPress={() => {
              setFilterSpec(specialty);
              setFilterLocation('');
              setShowFilter(true);
            }}
          >
            <Ionicons name="options" size={14} color="#111827" />
            <Text style={[styles.pillText, styles.pillTextActive]}>ფილტრი</Text>
            </TouchableOpacity>
        </View>
      </View>
          </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity style={styles.retry} onPress={fetchData}>
              <Text style={styles.retryText}>თავიდან ცდა</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={(it) => it.id}
            numColumns={2}
            columnWrapperStyle={{ gap: GAP, paddingHorizontal: GAP }}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 32, gap: GAP }}
            ListHeaderComponent={header}
            renderItem={renderCard}
            ListEmptyComponent={loading ? (
              <View style={styles.center}><ActivityIndicator color="#6366F1" size="large" /></View>
            ) : (
              <View style={styles.center}><Text style={styles.error}>ხელოსნები ვერ მოიძებნა</Text></View>
            )}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </SafeAreaView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Mechanic Modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ახალი ხელოსანი</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
              <ScrollView contentContainerStyle={styles.formGrid} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={styles.label}>სახელი *</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(t) => setForm({ ...form, name: t })}
                  placeholder="მაგ: გიორგი პაპაშვილი"
                  placeholderTextColor="#6B7280"
                  style={styles.inputDark}
                />
              </View>
              <View style={[styles.field, styles.fieldRelative]}>
                <Text style={styles.label}>სპეციალობა *</Text>
                    <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.inputDark, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  onPress={() => setShowSpecDropdown((v) => !v)}
                >
                  <Text style={{ color: form.specialty ? '#111827' : '#6B7280' }}>
                    {form.specialty || 'აირჩიე სპეციალობა'}
                  </Text>
                  <Ionicons name={showSpecDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
                </TouchableOpacity>
                {showSpecDropdown && (
                  <View style={styles.dropdownAbsolute}>
                    <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                      {SPECIALTIES.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setForm({ ...form, specialty: opt });
                            setShowSpecDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownText, form.specialty === opt && styles.dropdownTextActive]}>
                            {opt}
                        </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                  </View>
                )}
              </View>
              <View style={styles.fieldRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>ლოკაცია</Text>
                  <TextInput
                    value={form.location}
                    onChangeText={(t) => setForm({ ...form, location: t })}
                    placeholder="მაგ: თბილისი"
                    placeholderTextColor="#6B7280"
                    style={styles.inputDark}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>ტელეფონი</Text>
                  <TextInput
                    value={form.phone}
                    onChangeText={(t) => setForm({ ...form, phone: t })}
                    placeholder="5XX XX XX XX"
                    placeholderTextColor="#6B7280"
                    style={styles.inputDark}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>მისამართი</Text>
                <TextInput
                  value={form.address}
                  onChangeText={(t) => setForm({ ...form, address: t })}
                  placeholder="ქუჩა, ნომერი"
                  placeholderTextColor="#6B7280"
                  style={styles.inputDark}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Avatar URL</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.avatarPreview}>
                    {form.avatar ? (
                      <Image source={{ uri: form.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person" size={18} color="#9CA3AF" />
                    )}
                  </View>
                <TouchableOpacity 
                    style={styles.btnSecondary}
                    onPress={async () => {
                      photoService.showPhotoPickerOptions(async (res) => {
                        if (!res.success || !res.assets?.length) return;
                        const uri = res.assets[0].uri;
                        const up = await photoService.uploadPhoto(uri, 'mechanics');
                        if (up.success && up.url) {
                          setForm({ ...form, avatar: up.url });
                        }
                      });
                    }}
                  >
                    <Text style={styles.btnSecondaryText}>ფოტოს ატვირთვა</Text>
                </TouchableOpacity>
                </View>
                <TextInput
                  value={form.avatar}
                  onChangeText={(t) => setForm({ ...form, avatar: t })}
                  placeholder="ან ჩასვი URL"
                  placeholderTextColor="#6B7280"
                  style={[styles.inputDark, { marginTop: 8 }]}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>სერვისები (მძიმით)</Text>
                <TextInput
                  value={form.servicesCsv}
                  onChangeText={(t) => setForm({ ...form, servicesCsv: t })}
                  placeholder="ძრავის შეკეთება, დიაგნოსტიკა"
                  placeholderTextColor="#6B7280"
                  style={styles.inputDark}
                />
              </View>
              <View style={[styles.fieldRow, { alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text style={styles.label}>ხელმისაწვდომია</Text>
                <Switch
                  value={form.isAvailable}
                  onValueChange={(v) => setForm({ ...form, isAvailable: v })}
                  trackColor={{ false: '#374151', true: '#4ADE80' }}
                  thumbColor="#111827"
                />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowAdd(false)}>
                <Text style={styles.btnSecondaryText}>გაუქმება</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, saving && { opacity: 0.6 }]}
                disabled={saving}
                onPress={async () => {
                  if (!form.name.trim() || !form.specialty.trim()) {
                    setError('სახელი და სპეციალობა სავალდებულოა');
                    return;
                  }
                  try {
                    setSaving(true);
                    const payload = {
                      name: form.name.trim(),
                      specialty: form.specialty.trim(),
                      location: form.location.trim() || undefined,
                      phone: form.phone.trim() || undefined,
                      address: form.address.trim() || undefined,
                      avatar: form.avatar.trim() || undefined,
                      isAvailable: form.isAvailable,
                      services: form.servicesCsv
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    };
                    await mechanicsApi.createMechanic(payload as any);
                    setShowAdd(false);
                    setForm({ name: '', specialty: '', location: '', phone: '', address: '', avatar: '', servicesCsv: '', isAvailable: true });
                    fetchData();
                  } catch (e) {
                    console.error(e);
                    setError('შენახვა ვერ მოხერხდა');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <Text style={styles.btnPrimaryText}>{saving ? 'ინახება...' : 'დამატება'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilter} animationType="slide" transparent onRequestClose={() => setShowFilter(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ფილტრი</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ key: 'content' }]}
              keyExtractor={(i) => String(i.key)}
              renderItem={() => (
                <View style={styles.formGrid}>
                  <View style={styles.field}>
                    <Text style={styles.label}>სპეციალობა</Text>
                    <View style={styles.dropdown}>
                      {SPECIALTIES.map((opt) => (
                        <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => setFilterSpec(opt)}>
                          <Text style={[styles.dropdownText, filterSpec === opt && styles.dropdownTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>მდებარეობა (არასავალდებულო)</Text>
                    <TextInput
                      value={filterLocation}
                      onChangeText={setFilterLocation}
                      placeholder="მაგ: თბილისი"
                      placeholderTextColor="#6B7280"
                      style={styles.inputDark}
                    />
                  </View>
                </View>
              )}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => { setFilterSpec(''); setFilterLocation(''); setSpecialty(''); setShowFilter(false); }}
              >
                <Text style={styles.btnSecondaryText}>გასუფთავება</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => {
                  setSpecialty(filterSpec);
                  // Note: filterLocation can be wired to backend if needed
                  setShowFilter(false);
                  fetchData();
                }}
              >
                <Text style={styles.btnPrimaryText}>გამოყენება</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GAP, paddingTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  title: { color: '#111827', fontSize: 22, fontWeight: '800' },
  searchWrap: { marginTop: 12, marginHorizontal: GAP, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  input: { flex: 1, color: '#111827', fontSize: 14, fontWeight: '500' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: GAP, paddingVertical: 12 },
  pill: { borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F9FAFB' },
  pillActive: { borderColor: '#C7D2FE', backgroundColor: '#EEF2FF' },
  pillAccent: { borderColor: '#C7D2FE', backgroundColor: '#EEF2FF' },
  pillText: { color: '#6B7280', fontWeight: '600', fontSize: 12 },
  pillTextActive: { color: '#111827' },
  pillSm: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 8 },
  actionsCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { width: CARD_WIDTH, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardImageWrap: { width: '100%', height: 120, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  badgeRow: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.9)' },
  badgeRed: { backgroundColor: 'rgba(239,68,68,0.9)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 10 },
  ratingText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  ratingLight: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingLightText: { color: '#111827', fontSize: 12, fontWeight: '800' },
  cardBody: { padding: 12, gap: 6 },
  name: { color: '#111827', fontSize: 14, fontWeight: '800' },
  sub: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: CARD_WIDTH - 70 },
  meta: { color: '#6B7280', fontSize: 11, fontWeight: '600' },
  pricePill: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#EEF2FF', borderRadius: 10, borderWidth: 1, borderColor: '#C7D2FE' },
  pricePillText: { color: '#4338CA', fontSize: 11, fontWeight: '800' },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F3F4F6', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  tagText: { color: '#6B7280', fontSize: 10, fontWeight: '600', maxWidth: CARD_WIDTH / 2 - 16 },
  price: { color: '#4F46E5', fontSize: 11, fontWeight: '800' },
  center: { paddingTop: 40, alignItems: 'center' },
  error: { color: '#DC2626', fontSize: 14, marginBottom: 12 },
  retry: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#111827', fontWeight: '700' },
  headerAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
  headerAddBtnText: { color: '#111827', fontSize: 12, fontWeight: '700' },
  fab: { position: 'absolute', right: 16, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.5)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17,24,39,0.35)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  modalTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
  formGrid: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  field: { gap: 6 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  label: { color: '#374151', fontSize: 12, fontWeight: '600' },
  inputDark: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, color: '#111827' },
  modalActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 24 },
  btnSecondary: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', paddingVertical: 12, backgroundColor: '#F9FAFB' },
  btnSecondaryText: { color: '#374151', fontWeight: '700' },
  btnPrimary: { flex: 1, borderRadius: 12, backgroundColor: '#6366F1', alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#4F46E5' },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '800' },
  dropdown: { marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  dropdownAbsolute: { position: 'absolute', top: 76, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 50, elevation: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  dropdownTextActive: { color: '#111827' },
  fieldRelative: { position: 'relative' },
  avatarPreview: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
});
