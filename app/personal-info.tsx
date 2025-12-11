import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import { useUser } from '../contexts/UserContext';

export const options = { headerShown: false };

export default function PersonalInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { user, updateProfile } = useUser();

  const [fullName, setFullName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setPhone(user?.phone ?? '');
  }, [user?.id, user?.name, user?.email, user?.phone]);

  const emailInvalid = useMemo(() => {
    const trimmed = email.trim();
    if (!trimmed) return false;
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }, [email]);

  const hasChanges = useMemo(() => {
    return (
      fullName.trim() !== (user?.name ?? '') ||
      email.trim() !== (user?.email ?? '') ||
      phone.trim() !== (user?.phone ?? '')
    );
  }, [email, fullName, phone, user?.email, user?.name, user?.phone]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert(
        'საჭიროა ავტორიზაცია',
        'პირადი ინფორმაციის სანახავად ან შესანახად გაიარეთ ავტორიზაცია.',
        [
          { text: 'დახურვა', style: 'cancel' },
          { text: 'ავტორიზაცია', onPress: () => router.replace('/login') },
        ]
      );
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('შეავსეთ სახელი', 'გთხოვთ შეიყვანოთ თქვენი სახელი.');
      return;
    }

    if (emailInvalid) {
      Alert.alert('ელ-ფოსტის ფორმატი', 'გთხოვთ შეამოწმოთ ელ-ფოსტა.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      Alert.alert('განახლდა', 'პირადი ინფორმაცია შენახულია.');
    } catch (error) {
      Alert.alert('შეცდომა', 'ვერ შევინახეთ მონაცემები, სცადეთ თავიდან.');
    } finally {
      setSaving(false);
    }
  };

  const renderReadonlyField = (
    icon: string,
    label: string,
    value?: string,
    fallback?: string
  ) => (
    <View style={styles.infoItem}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.secondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value || fallback || '—'}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.headerButton,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>პირადი ინფორმაცია</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {!user ? (
        <View style={styles.emptyState}>
          <Ionicons name="person-circle-outline" size={52} color={colors.secondary} />
          <Text style={styles.emptyTitle}>არ ხართ ავტორიზებული</Text>
          <Text style={styles.emptySubtitle}>
            ავტორიზაციის შემდეგ შეძლებთ პირადი მონაცემების ნახვას და განახლებას.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>შესვლა</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{fullName || 'მომხმარებელი'}</Text>
                <Text style={styles.cardSubtitle}>{email || 'ელ-ფოსტა არ არის მითითებული'}</Text>
              </View>
              {user.role ? (
                <View style={[styles.rolePill, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                  <Text style={[styles.roleText, { color: colors.primary }]}>
                    {user.role}
                  </Text>
                </View>
              ) : null}
            </View>
            {renderReadonlyField('id-card-outline', 'მომხმარებლის ID', user.id)}
            {renderReadonlyField('time-outline', 'ანგარიში შექმნილია', '—', '—')}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.sectionTitle}>განახლება</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>სრული სახელი</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="მაგ: გიორგი მაისურაძე"
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colorScheme === 'dark' ? colors.surface : '#FFFFFF',
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ელ-ფოსტა</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="user@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: emailInvalid ? colors.error : colors.border,
                    backgroundColor: colorScheme === 'dark' ? colors.surface : '#FFFFFF',
                  },
                ]}
              />
              {emailInvalid && (
                <Text style={[styles.helperText, { color: colors.error }]}>
                  ელ-ფოსტის ფორმატი არასწორია
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ტელეფონი</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+995 5XX XXX XXX"
                keyboardType="phone-pad"
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colorScheme === 'dark' ? colors.surface : '#FFFFFF',
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (saving || !hasChanges) && styles.primaryButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving || !hasChanges}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? 'შენახვა...' : 'მონაცემების შენახვა'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setFullName(user?.name ?? '');
                setEmail(user?.email ?? '');
                setPhone(user?.phone ?? '');
              }}
              activeOpacity={0.8}
              disabled={!hasChanges || saving}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.secondary }]}>
                ცვლილებების გაუქმება
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
  },
  headerPlaceholder: {
    width: 44,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#111827',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#111827',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});
