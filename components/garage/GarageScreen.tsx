import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons as MIcon } from '@expo/vector-icons';
import CarCard from './CarCard';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import { Car } from '../../types/garage';
import { useCars } from '../../contexts/CarContext';

const DEMO_CARS: Car[] = [
  {
    id: '1',
    make: 'BMW',
    model: 'M5 Competition',
    year: 2023,
    plateNumber: 'AA-001-AA',
    imageUri: 'https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    lastService: new Date('2024-01-15'),
    nextService: new Date('2024-07-15'),
  },
  {
    id: '2',
    make: 'Mercedes-Benz',
    model: 'C63 S AMG',
    year: 2024,
    plateNumber: 'BB-002-BB',
    imageUri: 'https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    lastService: new Date('2024-02-01'),
    nextService: new Date('2024-08-01'),
  },
];

const QUICK_ACTIONS = [
  { id: '1', name: 'სერვისი', icon: 'build-outline', color: '#6366F1', bgColor: '#EEF2FF' },
  { id: '2', name: 'ჯავშანი', icon: 'calendar-outline', color: '#22C55E', bgColor: '#F0FDF4' },
  { id: '3', name: 'ისტორია', icon: 'time-outline', color: '#EF4444', bgColor: '#FEF2F2' },
];

const REMINDERS = [
  {
    id: '1',
    title: 'ზეთის გამოცვლა',
    car: 'BMW M5 Competition',
    date: '2024-07-15',
    type: 'service',
  },
  {
    id: '2',
    title: 'ტექდათვალიერება',
    car: 'Mercedes-Benz C63 S AMG',
    date: '2024-08-01',
    type: 'inspection',
  },
];

export default function GarageScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { cars, selectedCar, selectCar, addCar, removeCar } = useCars();
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [reminders, setReminders] = useState(REMINDERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newCar, setNewCar] = useState({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
  });
  const [newReminder, setNewReminder] = useState({
    title: '',
    date: '',
    type: 'service' as 'service' | 'inspection',
  });

  const handleAddCar = () => {
    if (!newCar.make || !newCar.model || !newCar.year || !newCar.plateNumber) {
      Alert.alert('შეცდომა', 'გთხოვთ შეავსოთ ყველა ველი');
      return;
    }

    addCar({
      make: newCar.make,
      model: newCar.model,
      year: parseInt(newCar.year),
      plateNumber: newCar.plateNumber,
    });

    setNewCar({ make: '', model: '', year: '', plateNumber: '' });
    setShowAddCarModal(false);
    Alert.alert('წარმატება', 'მანქანა წარმატებით დაემატა!');
  };

  const handleDeleteCar = (carId: string) => {
    Alert.alert(
      'მანქანის წაშლა',
      'ნამდვილად გსურთ ამ მანქანის წაშლა?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'წაშლა',
          style: 'destructive',
          onPress: () => {
            removeCar(carId);
            Alert.alert('წარმატება', 'მანქანა წაშლილია!');
          },
        },
      ]
    );
  };

  const renderCarCard = ({ item }: { item: Car }) => (
    <TouchableOpacity
      style={[
        styles.carCard,
        {
          backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF',
          borderColor: colorScheme === 'dark' ? '#333333' : '#F3F4F6',
        }
      ]}
      onPress={() => selectCar(item)}
    >
      <View style={styles.carHeader}>
        <View>
          <Text style={[styles.carMake, { color: colorScheme === 'dark' ? '#999999' : '#666666' }]}>
            {item.make}
          </Text>
          <Text style={[styles.carModel, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
            {item.model}
          </Text>
        </View>
        <View style={styles.carHeaderRight}>
          <View style={[
            styles.plateContainer,
            { backgroundColor: colorScheme === 'dark' ? '#333333' : '#F3F4F6' }
          ]}>
            <Text style={[
              styles.plateNumber,
              { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }
            ]}>
              {item.plateNumber}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCar(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ImageBackground
        source={{ uri: item.imageUri }}
        style={styles.carImage}
        imageStyle={{ borderRadius: 16 }}
      />

      <View style={[
        styles.carStats,
        { backgroundColor: colorScheme === 'dark' ? '#333333' : '#F3F4F6' }
      ]}>
        <View style={styles.statItem}>
          <Ionicons
            name="speedometer-outline"
            size={20}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          />
          <Text style={[
            styles.statValue,
            { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }
          ]}>
            12,450 კმ
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
          />
          <Text style={[
            styles.statValue,
            { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }
          ]}>
            {item.nextService?.toLocaleDateString('ka-GE')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderQuickAction = ({ id, name, icon, color, bgColor }: typeof QUICK_ACTIONS[0]) => (
    <TouchableOpacity key={id} style={styles.quickActionButton}>
      <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.quickActionText, { color: colors.secondary }]}>{name}</Text>
    </TouchableOpacity>
  );

  const renderReminder = ({ title, car, date, type }: typeof REMINDERS[0]) => {
    const isService = type === 'service';
    const iconColor = isService ? '#6366F1' : '#22C55E';
    const iconBg = isService ? '#EEF2FF' : '#F0FDF4';
    const daysUntil = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    
    return (
      <TouchableOpacity 
        style={[
          styles.reminderCard,
          { 
            backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF',
            borderColor: colorScheme === 'dark' ? '#333333' : '#F3F4F6',
          }
        ]}
      >
        <View style={[
          styles.reminderIcon,
          { backgroundColor: colorScheme === 'dark' ? `${iconColor}20` : iconBg }
        ]}>
          <Ionicons 
            name={isService ? 'build-outline' : 'car-outline'} 
            size={24} 
            color={iconColor}
          />
        </View>
        <View style={styles.reminderInfo}>
          <View style={styles.reminderHeader}>
            <Text style={[
              styles.reminderTitle,
              { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }
            ]}>
              {title}
            </Text>
            <View style={[
              styles.reminderBadge,
              { backgroundColor: colorScheme === 'dark' ? `${iconColor}20` : iconBg }
            ]}>
              <Text style={[styles.reminderBadgeText, { color: iconColor }]}>
                {daysUntil} დღე
              </Text>
            </View>
          </View>
          <View style={styles.reminderDetails}>
            <View style={styles.reminderDetailItem}>
              <Ionicons 
                name="car" 
                size={14} 
                color={colorScheme === 'dark' ? '#999999' : '#666666'} 
              />
              <Text style={[
                styles.reminderDetailText,
                { color: colorScheme === 'dark' ? '#999999' : '#666666' }
              ]}>
                {car}
              </Text>
            </View>
            <View style={styles.reminderDetailItem}>
              <Ionicons 
                name="calendar-outline" 
                size={14} 
                color={colorScheme === 'dark' ? '#999999' : '#666666'} 
              />
              <Text style={[
                styles.reminderDetailText,
                { color: colorScheme === 'dark' ? '#999999' : '#666666' }
              ]}>
                {new Date(date).toLocaleDateString('ka-GE')}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }
      ]}
    >
      {/* რამდენიმე მანქანის ლისტი, თითო ბარათი სრული ბლოკით */}
      <View style={styles.headerHero}>
        <View style={styles.heroHeaderRow}>
          <Text style={[styles.heroGreeting, { color: colorScheme === 'dark' ? '#FFFFFF' : '#111827' }]}>ჩემი მანქანები</Text>
          <TouchableOpacity onPress={() => setShowAddCarModal(true)} activeOpacity={0.9} style={styles.addSmallBtn}>
            <MIcon name="plus" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.heroCardsContent}
          snapToInterval={314}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const idx = Math.round(x / 314);
            setCurrentIndex(Math.max(0, Math.min(idx, cars.length - 1)));
          }}
          onScrollBeginDrag={(e) => {
            // რბილი დესელერაცია (მაგრამ უბრალო სქროლი საკმარისია)
          }}
        >
          {cars.map((car, i) => (
            <CarCard
              key={car.id}
              car={car}
              isActive={selectedCar?.id === car.id}
              onSelect={() => {
                selectCar(car);
              }}
              onUploadPhoto={() => {}}
            />
          ))}
        </ScrollView>
        <View style={styles.dotsRow}>
          {cars.map((c, i) => (
            <View key={c.id} style={[styles.dot, i === currentIndex ? styles.dotActive : undefined]} />
          ))}
        </View>
      </View>

      {/* ზედა ძველი ჰედერი ამოვიღე, რომ დუბლირება არ იყოს */}

      {/* ქვედა მანქანების ჰორიზონტალური სია ამოვიღე მოთხოვნის მიხედვით */}

      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map(renderQuickAction)}
      </View>

      <View style={styles.remindersSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>შეხსენებები</Text>
          <TouchableOpacity onPress={() => setShowAddReminderModal(true)}>
            <Text style={[styles.sectionAction, { color: colors.primary }]}>დამატება</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.remindersList}>
          {reminders.map(renderReminder)}
        </View>
      </View>

      <Modal
        visible={showAddCarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                ახალი მანქანის დამატება
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddCarModal(false)}
              >
                <Ionicons name="close" size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.modalInput, { 
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', 
                borderColor: colorScheme === 'dark' ? '#333333' : '#E5E7EB',
                backgroundColor: colorScheme === 'dark' ? '#333333' : '#F9FAFB'
              }]}
              placeholder="მარკა"
              placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#666666'}
              value={newCar.make}
              onChangeText={(text) => setNewCar({ ...newCar, make: text })}
            />
            
            <TextInput
              style={[styles.modalInput, { 
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', 
                borderColor: colorScheme === 'dark' ? '#333333' : '#E5E7EB',
                backgroundColor: colorScheme === 'dark' ? '#333333' : '#F9FAFB'
              }]}
              placeholder="მოდელი"
              placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#666666'}
              value={newCar.model}
              onChangeText={(text) => setNewCar({ ...newCar, model: text })}
            />
            
            <TextInput
              style={[styles.modalInput, { 
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', 
                borderColor: colorScheme === 'dark' ? '#333333' : '#E5E7EB',
                backgroundColor: colorScheme === 'dark' ? '#333333' : '#F9FAFB'
              }]}
              placeholder="წელი"
              placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#666666'}
              value={newCar.year}
              onChangeText={(text) => setNewCar({ ...newCar, year: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.modalInput, { 
                color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', 
                borderColor: colorScheme === 'dark' ? '#333333' : '#E5E7EB',
                backgroundColor: colorScheme === 'dark' ? '#333333' : '#F9FAFB'
              }]}
              placeholder="მონაკვეთი"
              placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#666666'}
              value={newCar.plateNumber}
              onChangeText={(text) => setNewCar({ ...newCar, plateNumber: text })}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colorScheme === 'dark' ? '#333333' : '#F3F4F6' }]}
                onPress={() => setShowAddCarModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                  გაუქმება
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddCar}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  დამატება
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Reminder Modal */}
      <Modal
        visible={showAddReminderModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddReminderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF' }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>ახალი შეხსენება</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowAddReminderModal(false)}>
                <Ionicons name="close" size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', borderColor: colorScheme === 'dark' ? '#333333' : '#E5E7EB', backgroundColor: colorScheme === 'dark' ? '#333333' : '#F9FAFB' }]}
              placeholder="სათაური"
              placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#666666'}
              value={newReminder.title}
              onChangeText={(t) => setNewReminder({ ...newReminder, title: t })}
            />
            <TextInput
              style={[styles.modalInput, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', borderColor: colorScheme === 'dark' ? '#333333' : '#E5E7EB', backgroundColor: colorScheme === 'dark' ? '#333333' : '#F9FAFB' }]}
              placeholder="თარიღი (YYYY-MM-DD)"
              placeholderTextColor={colorScheme === 'dark' ? '#999999' : '#666666'}
              value={newReminder.date}
              onChangeText={(t) => setNewReminder({ ...newReminder, date: t })}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colorScheme === 'dark' ? '#333333' : '#F3F4F6' }]} onPress={() => setShowAddReminderModal(false)}>
                <Text style={[styles.modalButtonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>გაუქმება</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (!newReminder.title || !newReminder.date) return;
                  const carTitle = `${selectedCar?.make ?? cars[0]?.make} ${selectedCar?.model ?? cars[0]?.model}`;
                  setReminders((prev) => [
                    { id: String(Date.now()), title: newReminder.title, car: carTitle, date: newReminder.date, type: newReminder.type },
                    ...prev,
                  ]);
                  setShowAddReminderModal(false);
                  setNewReminder({ title: '', date: '', type: 'service' });
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>დამატება</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  headerHero: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 24 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  heroGreeting: { fontSize: 28, fontFamily: 'Poppins_700Bold', marginBottom: 12, letterSpacing: -0.4 },
  heroCardsContent: { paddingHorizontal: 4, paddingRight: 20 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingLeft: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#111827' },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  heroTitle: { fontFamily: 'Poppins_700Bold', fontSize: 19, letterSpacing: -0.2 },
  heroSub: { fontFamily: 'Poppins_500Medium', fontSize: 12, marginTop: 2 },
  changeCarBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  changeCarText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#111827' },
  addSmallBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: '100%', height: 128, borderRadius: 18, marginBottom: 12 },
  platePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
  plateText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  repairLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, marginBottom: 8, letterSpacing: -0.1 },
  repairChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  repairChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  repairChipText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', paddingVertical: 12, borderRadius: 24 },
  uploadText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13 },
  uploadHint: { textAlign: 'center', fontFamily: 'Poppins_500Medium', fontSize: 11, marginTop: 8, letterSpacing: -0.1 },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  carsContainer: {
    marginTop: 20,
  },
  carsContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  carCard: {
    width: 300,
    borderRadius: 24,
    overflow: 'hidden' as const,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  carHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  carHeaderRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  carMake: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 4,
  },
  carModel: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5,
  },
  plateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  plateNumber: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  deleteButton: {
    padding: 8,
  },
  carImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
  },
  carStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    justifyContent: 'center' as const,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  quickActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center' as const,
  },
  remindersSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  sectionAction: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  remindersList: {
    gap: 12,
  },
  reminderCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  reminderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  reminderBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  reminderDetails: {
    gap: 8,
  },
  reminderDetailItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  reminderDetailText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalCard: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  inputLight: { flexBasis: '48%', height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, fontFamily: 'Poppins_500Medium', color: '#111827', backgroundColor: '#F9FAFB' },
  modalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 10 },
  cancelLight: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  cancelText: { fontFamily: 'Poppins_700Bold', color: '#111827' },
  primaryLight: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  primaryText: { fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 8,
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  inputRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: '100%',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: '100%',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
});