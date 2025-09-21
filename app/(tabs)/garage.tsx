import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  RefreshControl,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import CarHeroCard from '../../components/garage/CarHeroCard';
import CarDetailModal from '../../components/garage/CarDetailModal';
import { useCars } from '../../contexts/CarContext';
import { useUser } from '../../contexts/UserContext';
import { Car } from '../../types/garage';
import { useCarModal } from '../../contexts/ModalContext';
import AddReminderModal from '../../components/garage/AddReminderModal';

const { width, height } = Dimensions.get('window');

export default function GarageTab() {
  const router = useRouter();
  const { user } = useUser();
  const { cars, reminders, loading, refreshData, addCar, addReminder, fuelEntries, loadFuel, addFuel } = useCars();
  const { showAddCarModal } = useCarModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [showCarDetail, setShowCarDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [fuelForm, setFuelForm] = useState({
    liters: '',
    pricePerLiter: '',
    mileage: '',
    date: new Date().toISOString().slice(0,10),
  });


  // Filter cars based on search query
  const filteredCars = useMemo(() => {
    if (!searchQuery.trim()) return cars;
    return cars.filter(car => 
      car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cars, searchQuery]);

  // Filter reminders based on search query
  const filteredReminders = useMemo(() => {
    let list = reminders;
    if (selectedCar?.id) {
      list = list.filter((r: any) => r.carId === selectedCar.id);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((reminder: any) => 
      reminder.title.toLowerCase().includes(q) ||
      reminder.description?.toLowerCase().includes(q)
    );
  }, [reminders, searchQuery, selectedCar?.id]);

  // Load fuel/reminders for selected car
  React.useEffect(() => {
    if (selectedCar?.id) {
      loadFuel(selectedCar.id);
    }
  }, [selectedCar?.id, loadFuel]);

  const selectCar = useCallback((car: Car) => {
    setSelectedCar(selectedCar?.id === car.id ? null : car);
  }, [selectedCar]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
      await loadFuel(selectedCar?.id);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData, loadFuel, selectedCar?.id]);

  const handleAddCar = useCallback(async (data: { make: string; model: string; year: string; plateNumber: string; color?: string; fuelType?: string; transmission?: string; }) => {
    try {
      await addCar({
        make: data.make,
        model: data.model,
        year: Number(data.year),
        plateNumber: data.plateNumber,
      });
      await refreshData();
    } catch (e) {}
  }, [addCar, refreshData]);

  const handleAddReminder = useCallback(async (rem: { carId: string; title: string; description?: string; type: string; priority: string; reminderDate: string; reminderTime?: string; }) => {
    try {
      await addReminder(rem);
      setShowAddReminderModal(false);
      await refreshData();
    } catch (e) {}
  }, [addReminder, refreshData]);

  const submitFuel = useCallback(async () => {
    if (!selectedCar) { return; }
    try {
      await (async () => {
        await addFuel({
          carId: selectedCar.id,
          date: fuelForm.date,
          liters: Number(fuelForm.liters || 0),
          pricePerLiter: Number(fuelForm.pricePerLiter || 0),
          totalPrice: Number(fuelForm.liters || 0) * Number(fuelForm.pricePerLiter || 0),
          mileage: Number(fuelForm.mileage || 0),
        });
      })();
      setShowFuelModal(false);
      setFuelForm({ liters: '', pricePerLiter: '', mileage: '', date: new Date().toISOString().slice(0,10) });
      await loadFuel(selectedCar.id);
    } catch (e) {}
  }, [addFuel, fuelForm, selectedCar, loadFuel]);

  const renderReminderCard = (item: any) => (
    <View style={styles.reminderCard}>
      <View style={styles.reminderHeader}>
        <View style={styles.reminderIcon}>
          <Ionicons name="alarm" size={20} color="#6366F1" />
        </View>
        <View style={styles.reminderInfo}>
          <View style={styles.reminderTitleRow}>
            <Text style={styles.reminderTitle}>{item.title}</Text>
            <View style={[styles.reminderPriority, { backgroundColor: item.priority === 'მაღალი' ? '#FEF2F2' : item.priority === 'საშუალო' ? '#FFFBEB' : '#F0FDF4' }]}>
              <Text style={[styles.priorityText, { color: item.priority === 'მაღალი' ? '#EF4444' : item.priority === 'საშუალო' ? '#F59E0B' : '#10B981' }]}>
                {item.priority}
              </Text>
            </View>
          </View>
          <Text style={styles.reminderDescription}>{item.description || 'აღწერა არ არის'}</Text>
          <View style={styles.reminderTimeInfo}>
            <View style={styles.reminderTimeBadge}>
              <Ionicons name="time-outline" size={12} color="#6B7280" />
              <Text style={styles.reminderTime}>
                {item.reminderDate ? new Date(item.reminderDate).toLocaleDateString('ka-GE') : 'თარიღი არ არის'} • {item.reminderTime || '00:00'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="car" size={20} color="#FFFFFF" />
                </View>
              </View>
              <View>
                <Text style={styles.greeting}>გარაჟი</Text>
                <Text style={styles.username}>
                  {cars.length} მანქანა • {reminders.length} შეხსენება
                </Text>
              </View>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => setShowAddReminderModal(true)}
              >
                <Ionicons name="alarm" size={18} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => showAddCarModal(handleAddCar)}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cars Section */}
        <View style={styles.carsSection}>
          <Text style={styles.sectionTitle}>მანქანები</Text>
          {filteredCars.length > 0 ? (
            <View style={styles.carsList}>
              {filteredCars.map((car) => (
                <View key={car.id} style={styles.carItem}>
                  <CarHeroCard 
                    car={car}
                    isActive={selectedCar?.id === car.id}
                    onPress={(car) => {
                      selectCar(car);
                      setShowCarDetail(true);
                    }}
                  />
                  {selectedCar?.id === car.id && (
                    <View style={styles.carActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => setShowCarDetail(true)}
                      >
                        <Ionicons name="eye" size={16} color="#6366F1" />
                        <Text style={styles.actionText}>დეტალები</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => setShowAddReminderModal(true)}
                      >
                        <Ionicons name="add" size={16} color="#10B981" />
                        <Text style={styles.actionText}>შეხსენება</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>მანქანები ვერ მოიძებნა</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'ძებნის შედეგი ცარიელია' : 'დაამატე შენი პირველი მანქანა'}
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => showAddCarModal(handleAddCar)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>მანქანის დამატება</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>სწრაფი მოქმედებები</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => showAddCarModal(handleAddCar)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#6366F1' }]}>
                <Ionicons name="car" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>მანქანა</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setShowAddReminderModal(true)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#22C55E' }]}>
                <Ionicons name="alarm" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>შეხსენება</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => {}}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="settings" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>სერვისი</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => {}}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="folder" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>დოკუმენტი</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reminders Section */}
        {filteredReminders.length > 0 && (
          <View style={styles.remindersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>შეხსენებები</Text>
              <TouchableOpacity 
                style={styles.addReminderButton}
                onPress={() => setShowAddReminderModal(true)}
              >
                <Ionicons name="add" size={16} color="#6366F1" />
                <Text style={styles.addReminderText}>დამატება</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.remindersList}>
              {filteredReminders.map((reminder: any) => (
                <View key={reminder.id}>
                  {renderReminderCard(reminder)}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>სერვისები</Text>
            <TouchableOpacity 
              style={styles.addServiceButton}
              onPress={() => {}}
            >
              <Ionicons name="add" size={16} color="#10B981" />
              <Text style={styles.addServiceText}>ახალი სერვისი</Text>
            </TouchableOpacity>
          </View>
          
          {/* Upcoming Services - TODO: bind to backend (reminders/services) */}

          {/* Service History - TODO: bind list from backend */}
        </View>

        {/* Documents Section */}
        <View style={styles.documentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>დოკუმენტები</Text>
            <TouchableOpacity 
              style={styles.addDocumentButton}
              onPress={() => {}}
            >
              <Ionicons name="add" size={16} color="#6366F1" />
              <Text style={styles.addDocumentText}>დოკუმენტის დამატება</Text>
            </TouchableOpacity>
          </View>

          {/* Documents - TODO: bind from backend */}

          {/* Fuel Tracking */}
          <View style={styles.documentCategory}>
            <Text style={styles.categoryTitle}>საწვავის მოხმარება</Text>
            <View style={styles.fuelStatsCard}>
              <View style={styles.fuelStatsRow}>
                <View style={styles.fuelStat}>
                  <Text style={styles.fuelStatValue}>8.5</Text>
                  <Text style={styles.fuelStatLabel}>ლ/100კმ</Text>
                </View>
                <View style={styles.fuelStat}>
                  <Text style={styles.fuelStatValue}>1,250₾</Text>
                  <Text style={styles.fuelStatLabel}>ამ თვეში</Text>
                </View>
                <View style={styles.fuelStat}>
                  <Text style={styles.fuelStatValue}>450კმ</Text>
                  <Text style={styles.fuelStatLabel}>საშუალო</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.fuelHistoryCard}>
              <View style={styles.fuelHistoryHeader}>
                <Text style={styles.fuelHistoryTitle}>ბოლო შევსებები</Text>
                <TouchableOpacity 
                  style={styles.addFuelButton}
                  onPress={() => setShowFuelModal(true)}
                >
                  <Ionicons name="add" size={16} color="#10B981" />
                  <Text style={styles.addFuelText}>შევსება</Text>
                </TouchableOpacity>
              </View>
              
              {fuelEntries
                .filter(e => !selectedCar?.id || e.carId === selectedCar?.id)
                .slice(0, 5)
                .map((e) => (
                  <View key={e.id} style={styles.fuelEntry}>
                    <View style={styles.fuelIcon}>
                      <Ionicons name="car" size={16} color="#10B981" />
                    </View>
                    <View style={styles.fuelInfo}>
                      <Text style={styles.fuelDate}>{new Date(e.date).toLocaleDateString('ka-GE')}</Text>
                      <Text style={styles.fuelDetails}>{`${e.liters} ლიტრი • ${e.pricePerLiter}₾/ლ • ${e.totalPrice}₾`}</Text>
                    </View>
                    <View style={styles.fuelMileage}>
                      <Text style={styles.fuelMileageText}>{`${e.mileage} კმ`}</Text>
                    </View>
                  </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modალები */}
      <CarDetailModal visible={showCarDetail} car={selectedCar} onClose={() => setShowCarDetail(false)} />
      <AddReminderModal
        visible={showAddReminderModal}
        onClose={() => setShowAddReminderModal(false)}
        onAddReminder={handleAddReminder}
        cars={cars}
      />

      {/* Fuel Add Modal */}
      <Modal visible={showFuelModal} transparent animationType="fade" onRequestClose={() => setShowFuelModal(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', alignItems:'center' }}>
          <View style={{ width: '90%', backgroundColor:'#FFFFFF', borderRadius:16, padding:16 }}>
            <Text style={{ fontSize:18, fontFamily:'Inter', fontWeight:'500', color:'#111827', marginBottom:12 }}>საწვავის შევსება</Text>

            <View style={{ gap:10 }}>
              <View style={{ backgroundColor:'#FFFFFF', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12 }}>
                <TextInput
                  style={{ paddingHorizontal:14, paddingVertical:12, fontFamily:'Inter', fontSize:16, color:'#111827' }}
                  placeholder="ლიტრები"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={fuelForm.liters}
                  onChangeText={(t) => setFuelForm({ ...fuelForm, liters: t })}
                />
              </View>
              <View style={{ backgroundColor:'#FFFFFF', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12 }}>
                <TextInput
                  style={{ paddingHorizontal:14, paddingVertical:12, fontFamily:'Inter', fontSize:16, color:'#111827' }}
                  placeholder="ფასი (₾/ლ)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={fuelForm.pricePerLiter}
                  onChangeText={(t) => setFuelForm({ ...fuelForm, pricePerLiter: t })}
                />
              </View>
              <View style={{ backgroundColor:'#FFFFFF', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12 }}>
                <TextInput
                  style={{ paddingHorizontal:14, paddingVertical:12, fontFamily:'Inter', fontSize:16, color:'#111827' }}
                  placeholder="გარბენი (კმ)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={fuelForm.mileage}
                  onChangeText={(t) => setFuelForm({ ...fuelForm, mileage: t })}
                />
              </View>
              <View style={{ backgroundColor:'#FFFFFF', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12 }}>
                <TextInput
                  style={{ paddingHorizontal:14, paddingVertical:12, fontFamily:'Inter', fontSize:16, color:'#111827' }}
                  placeholder="თარიღი (YYYY-MM-DD)"
                  placeholderTextColor="#9CA3AF"
                  value={fuelForm.date}
                  onChangeText={(t) => setFuelForm({ ...fuelForm, date: t })}
                />
              </View>
            </View>

            <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:16 }}>
              <TouchableOpacity onPress={() => setShowFuelModal(false)} style={{ paddingVertical:12, paddingHorizontal:16, borderRadius:12, backgroundColor:'#F3F4F6' }}>
                <Text style={{ fontFamily:'Inter', fontWeight:'500', color:'#111827' }}>გაუქმება</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitFuel} style={{ flexDirection:'row', alignItems:'center', gap:8, paddingVertical:12, paddingHorizontal:16, borderRadius:12, backgroundColor:'#10B981' }}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={{ fontFamily:'Inter', fontWeight:'500', color:'#FFFFFF' }}>შენახვა</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  profileRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative' as const,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  greeting: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: -0.2,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  username: {
    fontSize: 20,
    fontWeight: '500' as const,
    color: '#111827',
    letterSpacing: -0.5,
    fontFamily: 'Inter',
  },
  headerButtons: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  quickActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 8,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
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
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#64748B',
    textAlign: 'center' as const,
    fontFamily: 'Inter',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500' as const,
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#111827',
    letterSpacing: 0.1,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentScroll: {
    flex: 1,
  },
  carsSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  carsList: {
    gap: 16,
  },
  carItem: {
    marginBottom: 8,
  },
  carActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
  },
  remindersSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addReminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addReminderText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6366F1',
    letterSpacing: 0.2,
  },
  remindersList: {
    gap: 12,
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  reminderDescription: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  reminderPriority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  reminderTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
  },
  reminderTime: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Services Section
  servicesSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addServiceText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#10B981',
  },
  upcomingSection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  upcomingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upcomingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  upcomingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  upcomingDate: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#9CA3AF',
  },
  upcomingBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  upcomingBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  historySection: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  serviceCost: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  serviceCostText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#10B981',
  },
  serviceDetails: {
    gap: 4,
  },
  serviceDate: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  serviceDescription: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
    lineHeight: 20,
  },
  // Documents Section
  documentsSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addDocumentText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6366F1',
  },
  documentCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 8,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  documentSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  documentStatus: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  documentStatusText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#10B981',
  },
  documentAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fuel Tracking Styles
  fuelStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  fuelStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fuelStat: {
    alignItems: 'center',
    gap: 4,
  },
  fuelStatValue: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
  },
  fuelStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  fuelHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  fuelHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fuelHistoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
  },
  addFuelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addFuelText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#10B981',
  },
  fuelEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fuelIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuelInfo: {
    flex: 1,
  },
  fuelDate: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  fuelDetails: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  fuelMileage: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fuelMileageText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#111827',
  },
});