import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  RefreshControl,
  StatusBar,
  ImageBackground,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCars } from '../../contexts/CarContext';
import { useUser } from '../../contexts/UserContext';
import { Car } from '../../types/garage';
import AddCarModal from '../../components/garage/AddCarModal';
import AddReminderModal from '../../components/garage/AddReminderModal';
import GamificationCard from '../../components/ui/GamificationCard';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: '1', name: 'ჯავშანი', icon: 'calendar-outline', color: '#22C55E', bgColor: '#F0FDF4' },
  { id: '2', name: 'შეხსენება', icon: 'notifications-outline', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: '3', name: 'დაზღვევა', icon: 'shield-outline', color: '#EF4444', bgColor: '#FEF2F2' },
  { id: '4', name: 'ისტორია', icon: 'time-outline', color: '#F59E0B', bgColor: '#FFFBEB' },
];


export default function GarageTab() {
  const router = useRouter();
  const { clearStorage } = useUser();
  const { 
    cars, 
    selectedCar, 
    reminders, 
    loading, 
    error, 
    selectCar, 
    addCar, 
    addReminder, 
    refreshData 
  } = useCars();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bannerExpanded, setBannerExpanded] = useState(true);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const bannerHeight = useRef(new Animated.Value(180)).current;
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const reminderCardScaleAnim = useRef(new Animated.Value(1)).current;

  const toggleBanner = () => {
    const newExpandedState = !bannerExpanded;
    const toValue = newExpandedState ? 180 : 80;
    
    setBannerExpanded(newExpandedState);
    
    Animated.timing(bannerHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const styles = StyleSheet.create({
    safeArea: { 
      flex: 1, 
      backgroundColor: '#FFFFFF' 
    },
    container: { 
      flex: 1, 
      backgroundColor: '#FFFFFF' 
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      paddingBottom: 24,
      backgroundColor: '#FFFFFF',
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    collapseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'NotoSans_700Bold',
      color: '#1A1A1A',
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      fontFamily: 'NotoSans_500Medium',
      color: '#6B7280',
      marginTop: 4,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#6366F1',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      gap: 6,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: 'NotoSans_600SemiBold',
    },
    content: {
      flex: 1,
      backgroundColor: '#F8F9FA',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'NotoSans_500Medium',
      color: '#1A1A1A',
      marginLeft: 12,
    },
    searchButton: {
      padding: 8,
    },
    carsSliderContainer: {
      marginTop: 20,
      marginBottom: 20,
    },
    carCard: {
      width: width - 40,
      marginHorizontal: 10,
      marginBottom: 6,
    },
    carCardSelected: {
      transform: [{ scale: 1.02 }],
    },
    carCardTouchable: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    carCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderRadius: 16,
    },
    carCardContentSelected: {
      backgroundColor: '#111827',
      borderColor: '#111827',
    },
    carImageContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    carInfo: {
      flex: 1,
      gap: 4,
    },
    carHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    carMake: {
      fontSize: 14,
      fontFamily: 'NotoSans_700Bold',
    },
    carModel: {
      fontSize: 14,
      fontFamily: 'NotoSans_500Medium',
      marginBottom: 6,
    },
    carDetails: {
      flexDirection: 'row',
      gap: 8,
    },
    carDetailBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 4,
    },
    carPlate: {
      fontSize: 12,
      fontFamily: 'NotoSans_600SemiBold',
    },
    carYear: {
      fontSize: 12,
      fontFamily: 'NotoSans_600SemiBold',
    },
    selectedIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceInfo: {
      alignItems: 'flex-end',
      gap: 4,
    },
    serviceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    serviceLabel: {
      fontSize: 12,
      fontFamily: 'NotoSans_500Medium',
    },
    serviceDate: {
      fontSize: 14,
      fontFamily: 'NotoSans_700Bold',
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      gap: 8,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#374151',
    },
    paginationDotActive: {
      width: 24,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#3B82F6',
    },
    quickActionsContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    quickActionsRow: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    quickActionItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    quickActionIconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F8F9FA',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    quickActionText: {
      fontSize: 12,
      fontFamily: 'NotoSans_500Medium',
      color: '#6B7280',
      textAlign: 'center',
    },
    remindersSection: {
      marginTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 70,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'NotoSans_700Bold',
      color: '#1A1A1A',
    },
    sectionAction: {
      fontSize: 14,
      fontFamily: 'NotoSans_600SemiBold',
      color: '#3B82F6',
    },
    remindersList: {
      gap: 12,
    },
    reminderCard: {
      marginBottom: 6,
    },
    reminderCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderRadius: 16,
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    reminderIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      borderWidth: 2,
    },
    reminderInfo: {
      flex: 1,
      gap: 4,
    },
    reminderSubtitle: {
      fontSize: 12,
      fontFamily: 'NotoSans_500Medium',
      color: '#6B7280',
      marginBottom: 6,
    },
    reminderDetails: {
      flexDirection: 'row',
      gap: 16,
    },
    reminderDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    reminderDetailText: {
      fontSize: 12,
      fontFamily: 'NotoSans_500Medium',
      color: '#6B7280',
    },
    reminderActionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    reminderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    urgentBadge: {
      backgroundColor: '#FEF2F2',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    urgentText: {
      fontSize: 10,
      fontFamily: 'NotoSans_600SemiBold',
      color: '#EF4444',
    },
    reminderDate: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    reminderDateText: {
      fontSize: 11,
      fontFamily: 'NotoSans_500Medium',
      color: '#6B7280',
    },
    reminderTitle: {
      fontSize: 14,
      fontFamily: 'NotoSans_700Bold',
      color: '#1A1A1A',
      flex: 1,
    },
    reminderBadge: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    reminderBadgeText: {
      fontSize: 12,
      fontFamily: 'NotoSans_600SemiBold',
    },
    noCarsContainer: {
      backgroundColor: '#F8F9FA',
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
    },
    noCarsText: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 14,
      color: '#1A1A1A',
      marginBottom: 8,
    },
    noCarsSubtext: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
    },
  });

  const filteredCars = useMemo(() => {
    if (!searchQuery.trim()) return cars;
    return cars.filter(car => 
      car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cars, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlide(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderCarBanner = ({ item, index }: { item: Car; index: number }) => {
    const carColors = [
      { primary: '#3B82F6', secondary: '#EEF2FF' },
      { primary: '#10B981', secondary: '#D1FAE5' },
      { primary: '#EF4444', secondary: '#FEF2F2' },
      { primary: '#8B5CF6', secondary: '#EDE9FE' },
      { primary: '#F59E0B', secondary: '#FEF3C7' },
      { primary: '#06B6D4', secondary: '#CFFAFE' },
    ];

    const colors = carColors[index % carColors.length];
    const nextServiceDate = item.nextService?.toLocaleDateString('ka-GE') || 'არ არის დაგეგმილი';
    const isSelected = selectedCar?.id === item.id;

    return (
      <Animated.View style={[
        styles.carCard, 
        { height: bannerHeight },
        isSelected && styles.carCardSelected
      ]}>
        <TouchableOpacity 
          style={styles.carCardTouchable}
          onPress={() => {
            selectCar(item);
            // Card scale animation on selection
            Animated.sequence([
              Animated.timing(cardScaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.spring(cardScaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
            ]).start();
          }}
          activeOpacity={0.8}
        >
          <Animated.View style={[
            styles.carCardContent,
            isSelected && styles.carCardContentSelected,
            {
              transform: [{ scale: cardScaleAnim }]
            }
          ]}>
            {/* Car Image Container */}
            <View style={[
              styles.carImageContainer,
              { backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : colors.secondary }
            ]}>
              <Ionicons 
                name="car-sport" 
                size={32} 
                color={isSelected ? "#FFFFFF" : colors.primary} 
              />
            </View>
            
            {/* Car Info */}
            <View style={styles.carInfo}>
              <View style={styles.carHeader}>
                <Text style={[
                  styles.carMake,
                  { color: isSelected ? "#FFFFFF" : "#111827" }
                ]}>
                  {item.make}
                </Text>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={[
                styles.carModel,
                { color: isSelected ? "rgba(255,255,255,0.9)" : "#6B7280" }
              ]}>
                {item.model}
              </Text>
              <View style={styles.carDetails}>
                <View style={[
                  styles.carDetailBadge,
                  { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(17, 24, 39, 0.1)' }
                ]}>
                  <Ionicons 
                    name="card" 
                    size={12} 
                    color={isSelected ? "#FFFFFF" : "#6B7280"} 
                  />
                  <Text style={[
                    styles.carPlate,
                    { color: isSelected ? "#FFFFFF" : "#6B7280" }
                  ]}>
                    {item.plateNumber}
                  </Text>
                </View>
                <View style={[
                  styles.carDetailBadge,
                  { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(17, 24, 39, 0.1)' }
                ]}>
                  <Ionicons 
                    name="calendar" 
                    size={12} 
                    color={isSelected ? "#FFFFFF" : "#6B7280"} 
                  />
                  <Text style={[
                    styles.carYear,
                    { color: isSelected ? "#FFFFFF" : "#6B7280" }
                  ]}>
                    {item.year}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Service Info */}
            {bannerExpanded && (
              <View style={styles.serviceInfo}>
                <View style={styles.serviceHeader}>
                  <Ionicons 
                    name="settings" 
                    size={16} 
                    color={isSelected ? "#FFFFFF" : colors.primary} 
                  />
                  <Text style={[
                    styles.serviceLabel,
                    { color: isSelected ? "#FFFFFF" : "#6B7280" }
                  ]}>
                    შემდეგი სერვისი
                  </Text>
                </View>
                <Text style={[
                  styles.serviceDate,
                  { color: isSelected ? "#FFFFFF" : "#111827" }
                ]}>
                  {nextServiceDate}
                </Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case '1': // ჯავშანი
        router.push('/bookings');
        break;
      case '2': // შეხსენება
        setShowAddReminderModal(true);
        break;
      case '3': // დაზღვევა
        // TODO: Insurance tracking page
        break;
      case '4': // ისტორია
        // TODO: Service history page
        break;
    }
  };


  const getReminderIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'maintenance': 'build-outline',
      'inspection': 'search-outline',
      'battery': 'battery-half-outline',
      'tires': 'ellipse-outline',
      'insurance': 'shield-outline',
      'service': 'settings-outline',
    };
    return iconMap[type] || 'notifications-outline';
  };

  const getReminderColors = (type: string, isUrgent: boolean) => {
    if (isUrgent) {
      return { color: '#EF4444', bgColor: '#FEF2F2' };
    }
    
    const colorMap: { [key: string]: { color: string; bgColor: string } } = {
      'maintenance': { color: '#3B82F6', bgColor: '#EEF2FF' },
      'inspection': { color: '#10B981', bgColor: '#D1FAE5' },
      'battery': { color: '#F59E0B', bgColor: '#FEF3C7' },
      'tires': { color: '#8B5CF6', bgColor: '#EDE9FE' },
      'insurance': { color: '#EF4444', bgColor: '#FEF2F2' },
      'service': { color: '#6366F1', bgColor: '#EEF2FF' },
    };
    return colorMap[type] || { color: '#6B7280', bgColor: '#F3F4F6' };
  };

  const renderReminder = (reminder: any) => {
    const colors = getReminderColors(reminder.type, reminder.isUrgent);
    const icon = getReminderIcon(reminder.type);
    const reminderDate = new Date(reminder.reminderDate);
    const car = cars.find(c => c.id === reminder.carId);
    
    return (
      <TouchableOpacity 
        key={reminder.id} 
        style={styles.reminderCard}
        onPress={() => {
          // Reminder card scale animation
          Animated.sequence([
            Animated.timing(reminderCardScaleAnim, {
              toValue: 0.95,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.spring(reminderCardScaleAnim, {
              toValue: 1,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
        }}
        activeOpacity={0.8}
      >
        <Animated.View style={[
          styles.reminderCardContent,
          {
            transform: [{ scale: reminderCardScaleAnim }]
          }
        ]}>
          {/* Icon Container */}
          <View style={[
            styles.reminderIconContainer,
            { 
              backgroundColor: colors.bgColor,
              borderColor: colors.color
            }
          ]}>
            <Ionicons name={icon as any} size={20} color={colors.color} />
          </View>
          
          {/* Reminder Info */}
          <View style={styles.reminderInfo}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              {reminder.isUrgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>გადაუდებელი</Text>
                </View>
              )}
            </View>
            <Text style={styles.reminderSubtitle}>
              {car ? `${car.make} ${car.model}` : 'მანქანა ვერ მოიძებნა'}
            </Text>
            <View style={styles.reminderDetails}>
              <View style={styles.reminderDetailItem}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.reminderDetailText}>{reminderDate.toLocaleDateString('ka-GE')}</Text>
              </View>
              {reminder.reminderTime && (
                <View style={styles.reminderDetailItem}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.reminderDetailText}>{reminder.reminderTime}</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Action Button */}
          <TouchableOpacity style={styles.reminderActionButton}>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>ჩემი მანქანები</Text>
              <Text style={styles.headerSubtitle}>
                {cars.length} მანქანა დარეგისტრირებული
              </Text>
            </View>
           
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddCarModal(true)}
          >
            <Ionicons name="car" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>მანქანის დამატება</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3B82F6']}
          />
        }
      >
        {/* Gamification Card */}
        <GamificationCard />

        {/* Cars Slider */}
        {filteredCars.length > 0 ? (
          <View style={styles.carsSliderContainer}>
            <FlatList
              ref={flatListRef}
              data={filteredCars}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              keyExtractor={(item) => item.id}
              renderItem={renderCarBanner}
              snapToInterval={width - 20}
              snapToAlignment="center"
              decelerationRate="fast"
              contentContainerStyle={{ 
                paddingHorizontal: 20,
                alignItems: 'center',
                gap: 20
              }}
              getItemLayout={(data, index) => ({
                length: width - 20,
                offset: (width - 20) * index,
                index,
              })}
            />
            
            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              {filteredCars.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentSlide && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.noCarsContainer}>
            <Text style={styles.noCarsText}>მანქანები ვერ მოიძებნა</Text>
            <Text style={styles.noCarsSubtext}>ახალი მანქანის დასამატებლად დააჭირეთ "+" ღილაკს</Text>
          </View>
        )}

        {/* Quick Actions - Minimalist Design */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity 
                key={action.id}
                style={styles.quickActionItem}
                onPress={() => handleQuickAction(action.id)}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIconWrapper}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.quickActionText}>{action.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminders */}
        <View style={styles.remindersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>შეხსენებები</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>ყველას ნახვა</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.remindersList}>
            {loading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280', fontFamily: 'NotoSans_500Medium' }}>
                  ჩატვირთვა...
                </Text>
              </View>
            ) : reminders.length > 0 ? (
              reminders.slice(0, 3).map(renderReminder)
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280', fontFamily: 'NotoSans_500Medium' }}>
                  შეხსენებები ვერ მოიძებნა
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add Car Modal */}
      <AddCarModal
        visible={showAddCarModal}
        onClose={() => setShowAddCarModal(false)}
        onAddCar={(carData) => {
          addCar({
            make: carData.make,
            model: carData.model,
            year: parseInt(carData.year),
            plateNumber: carData.plateNumber,
          });
          setShowAddCarModal(false);
        }}
      />

      {/* Add Reminder Modal */}
      <AddReminderModal
        visible={showAddReminderModal}
        onClose={() => setShowAddReminderModal(false)}
        onAddReminder={async (reminderData) => {
          try {
            await addReminder({
              carId: reminderData.carId,
              title: reminderData.title,
              description: reminderData.description,
              type: reminderData.type,
              priority: reminderData.priority,
              reminderDate: reminderData.reminderDate,
              reminderTime: reminderData.reminderTime,
            });
            setShowAddReminderModal(false);
          } catch (err) {
            console.error('Error adding reminder:', err);
          }
        }}
        cars={cars.map(car => ({
          id: car.id,
          make: car.make,
          model: car.model,
          plateNumber: car.plateNumber,
          displayName: `${car.make} ${car.model} (${car.plateNumber})`
        }))}
      />
    </SafeAreaView>
  );
}
