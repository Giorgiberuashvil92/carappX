import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Car } from '@/types/garage';

export type CarCardProps = {
  car: Car;
  isActive: boolean;
  onSelect: () => void;
  onUploadPhoto: () => void;
};

export default function CarCard({ car, isActive, onSelect, onUploadPhoto }: CarCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const styles = createStyles(theme);

  return (
    <View style={[styles.cardWrap, isActive && { borderColor: theme.primary }]}>
      <View style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        isActive && { shadowOpacity: 0.12, transform: [{ scale: 1.02 }] },
      ]}>
        <View style={styles.headerRow}>
          <View style={{ flexShrink: 1 }}>
            <Text numberOfLines={1} style={styles.title}>{`${car.year} ${car.make} ${car.model}`}</Text>
            <Text style={styles.subtitle}>სპორტული</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.activeBadge, isActive && styles.activeBadgeOn]}
            onPress={onSelect}
          >
            <MIcon name={isActive ? 'check' : 'checkbox-blank-circle-outline'} size={14} color={isActive ? '#FFFFFF' : '#111827'} />
            <Text style={[styles.activeText, isActive && { color: '#FFFFFF' }]}>{isActive ? 'აქტიური' : 'არჩევა'}</Text>
          </TouchableOpacity>
        </View>

        {!!car.plateNumber && (
          <View style={[styles.plate, { borderColor: theme.border, backgroundColor: colorScheme === 'dark' ? '#111827' : '#F3F4F6' }]}>
            <MIcon name="card-account-details-outline" size={12} color={colorScheme === 'dark' ? '#E5E7EB' : '#374151'} />
            <Text style={styles.plateText}>სანომრე: {car.plateNumber}</Text>
          </View>
        )}

        <ImageBackground source={{ uri: car.imageUri }} style={styles.image} imageStyle={{ borderRadius: 16 }} />

        <Text style={styles.sectionLabel}>რემონტი:</Text>
        <View style={styles.chipsRow}>
          {[
            { label: 'ბორბლები', icon: 'car' },
            { label: 'ძრავი', icon: 'engine-outline' },
            { label: 'ზეთის შეცვლა', icon: 'oil' },
            { label: 'მინსაწმენდები', icon: 'car-windshield-outline' },
          ].map((it) => (
            <View key={it.label} style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.card }]}> 
              <MIcon name={it.icon as any} size={14} color={'#6B7280'} />
              <Text style={styles.chipText}>{it.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.uploadBtn} onPress={onUploadPhoto}>
          <MIcon name="cloud-upload-outline" size={18} color="#FFFFFF" />
          <Text style={styles.uploadText}>ფოტოს ატვირთვა</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>ატვირთე მანქანის ფოტო დიაგნოზისთვის.</Text>
      </View>
    </View>
  );
}

function createStyles(theme: typeof Colors.light) {
  return StyleSheet.create({
    cardWrap: {
      width: 320,
      padding: 10,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 14,
    },
    card: {
      flex: 1,
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#111827', letterSpacing: -0.2 },
    subtitle: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#6B7280', marginTop: 2 },
    activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
    activeBadgeOn: { backgroundColor: '#111827', borderColor: '#111827' },
    activeText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#111827' },
    plate: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
    plateText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#111827' },
    image: { width: '100%', height: 140, borderRadius: 16, marginTop: 12 },
    sectionLabel: { marginTop: 14, fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#6B7280' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
    chipText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#111827' },
    uploadBtn: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', paddingVertical: 12, borderRadius: 24 },
    uploadText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13 },
    hint: { marginTop: 8, textAlign: 'center', color: '#9CA3AF', fontFamily: 'Poppins_500Medium', fontSize: 11 },
  });
}


