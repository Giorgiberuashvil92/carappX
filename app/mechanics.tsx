import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Mechanic {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  experience: string;
  location: string;
  distance: string;
  price: string;
  avatar: string;
  isAvailable: boolean;
  services: string[];
  description: string;
}

const MECHANICS_DATA: Mechanic[] = [
  {
    id: '1',
    name: 'გიორგი ბერიძე',
    specialty: 'ელექტრიკოსი',
    rating: 4.9,
    reviews: 127,
    experience: '8 წელი',
    location: 'ვაკე, თბილისი',
    distance: '2.3 კმ',
    price: '50₾/საათი',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    isAvailable: true,
    services: ['ელექტრო სისტემა', 'ბატარეა', 'გენერატორი', 'სტარტერი'],
    description: 'პროფესიონალური ელექტრიკოსი 8 წლიანი გამოცდილებით. სპეციალიზებული ყველა ტიპის ავტომობილზე.'
  },
  {
    id: '2',
    name: 'ლევან კვარაცხელია',
    specialty: 'მექანიკოსი',
    rating: 4.8,
    reviews: 89,
    experience: '12 წელი',
    location: 'ისანი, თბილისი',
    distance: '4.1 კმ',
    price: '45₾/საათი',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
    isAvailable: true,
    services: ['ძრავი', 'ტრანსმისია', 'საბურავები', 'ფრენები'],
    description: 'გამოცდილი მექანიკოსი ყველა ტიპის ავტომობილის შეკეთებაზე. 24/7 სერვისი.'
  },
  {
    id: '3',
    name: 'ნინო ჩხიკვაძე',
    specialty: 'დიაგნოსტიკა',
    rating: 4.9,
    reviews: 156,
    experience: '6 წელი',
    location: 'საბურთალო, თბილისი',
    distance: '1.8 კმ',
    price: '60₾/საათი',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400&auto=format&fit=crop',
    isAvailable: false,
    services: ['კომპიუტერული დიაგნოსტიკა', 'OBD სკანერი', 'ძრავის ანალიზი'],
    description: 'პროფესიონალური დიაგნოსტიკა ყველა ტიპის ავტომობილისთვის. თანამედროვე ტექნოლოგიები.'
  },
  {
    id: '4',
    name: 'დავით ხარაძე',
    specialty: 'კონდიციონერი',
    rating: 4.7,
    reviews: 73,
    experience: '5 წელი',
    location: 'დიდუბე, თბილისი',
    distance: '3.5 კმ',
    price: '40₾/საათი',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    isAvailable: true,
    services: ['კონდიციონერი', 'გათბობა', 'ვენტილაცია', 'ფილტრები'],
    description: 'სპეციალისტი ავტომობილის კლიმატ კონტროლზე. სწრაფი და ხარისხიანი სერვისი.'
  },
  {
    id: '5',
    name: 'თამარ მელაძე',
    specialty: 'საბურავების სპეციალისტი',
    rating: 4.8,
    reviews: 94,
    experience: '7 წელი',
    location: 'ჩუღურეთი, თბილისი',
    distance: '2.9 კმ',
    price: '35₾/საათი',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop',
    isAvailable: true,
    services: ['საბურავების შეცვლა', 'ბალანსირება', 'შეკეთება', 'შენახვა'],
    description: 'პროფესიონალური სერვისი საბურავების შეცვლაზე და შენახვაზე. ყველა ზომა.'
  }
];

const SPECIALTIES = [
  { id: 'all', title: 'ყველა', icon: 'grid-outline' },
  { id: 'electrician', title: 'ელექტრიკოსი', icon: 'flash-outline' },
  { id: 'mechanic', title: 'მექანიკოსი', icon: 'build-outline' },
  { id: 'diagnostic', title: 'დიაგნოსტიკა', icon: 'analytics-outline' },
  { id: 'ac', title: 'კონდიციონერი', icon: 'snow-outline' },
  { id: 'tires', title: 'საბურავები', icon: 'disc-outline' },
];

const LOCATIONS = [
  { id: 'vake', title: 'ვაკე', icon: 'location-outline' },
  { id: 'isani', title: 'ისანი', icon: 'location-outline' },
  { id: 'saburtalo', title: 'საბურთალო', icon: 'location-outline' },
  { id: 'didube', title: 'დიდუბე', icon: 'location-outline' },
  { id: 'chugureti', title: 'ჩუღურეთი', icon: 'location-outline' },
  { id: 'mtatsminda', title: 'მთაწმინდა', icon: 'location-outline' },
  { id: 'old_tbilisi', title: 'ძველი თბილისი', icon: 'location-outline' },
];

const ALL_SERVICES = [
  'ელექტრო სისტემა', 'ბატარეა', 'გენერატორი', 'სტარტერი',
  'ძრავი', 'ტრანსმისია', 'საბურავები', 'ფრენები',
  'კომპიუტერული დიაგნოსტიკა', 'OBD სკანერი', 'ძრავის ანალიზი',
  'კონდიციონერი', 'გათბობა', 'ვენტილაცია', 'ფილტრები',
  'საბურავების შეცვლა', 'ბალანსირება', 'შეკეთება', 'შენახვა'
];

const TIME_AVAILABILITY = [
  { id: 'all', title: 'ყველა დრო', icon: 'time-outline' },
  { id: 'morning', title: 'დილა (8:00-12:00)', icon: 'sunny-outline' },
  { id: 'afternoon', title: 'შუადღე (12:00-18:00)', icon: 'partly-sunny-outline' },
  { id: 'evening', title: 'საღამო (18:00-22:00)', icon: 'moon-outline' },
  { id: 'night', title: 'ღამე (22:00-8:00)', icon: 'moon-outline' },
  { id: '24_7', title: '24/7', icon: 'time-outline' },
];

const SPECIAL_FEATURES = [
  { id: 'emergency', title: 'ემერგენცია', icon: 'warning-outline' },
  { id: 'mobile', title: 'მობილური სერვისი', icon: 'car-outline' },
  { id: 'warranty', title: 'გარანტია', icon: 'shield-checkmark-outline' },
  { id: 'certified', title: 'სერტიფიცირებული', icon: 'ribbon-outline' },
  { id: 'fast', title: 'სწრაფი სერვისი', icon: 'flash-outline' },
];

const SORT_OPTIONS = [
  { id: 'rating', title: 'რეიტინგი', icon: 'star-outline' },
  { id: 'price_low', title: 'ფასი (დაბალი)', icon: 'trending-down-outline' },
  { id: 'price_high', title: 'ფასი (მაღალი)', icon: 'trending-up-outline' },
  { id: 'distance', title: 'მანძილი', icon: 'location-outline' },
  { id: 'experience', title: 'გამოცდილება', icon: 'time-outline' },
];

export default function MechanicsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [mechanics, setMechanics] = useState<Mechanic[]>(MECHANICS_DATA);
  
  // Filter Modal States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDistance, setFilterDistance] = useState(10);
  const [filterExperience, setFilterExperience] = useState('all');
  
  // New Custom Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [filterTimeAvailability, setFilterTimeAvailability] = useState('all');
  const [filterSpecialFeatures, setFilterSpecialFeatures] = useState<string[]>([]);
  const [filterSortBy, setFilterSortBy] = useState('rating');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const filteredMechanics = mechanics.filter(mechanic => {
    // Search filter
    const matchesSearch = mechanic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mechanic.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mechanic.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Specialty filter
    const matchesSpecialty = selectedSpecialty === 'all' || 
                            mechanic.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    
    // Distance filter (extract number from distance string like "2.3 კმ")
    const distanceNumber = parseFloat(mechanic.distance.replace(/[^\d.]/g, ''));
    const matchesDistance = distanceNumber <= filterDistance;
    
    // Experience filter (extract years from experience string like "8 წელი")
    const experienceYears = parseInt(mechanic.experience.replace(/[^\d]/g, ''));
    const matchesExperience = filterExperience === 'all' ||
                             (filterExperience === '1-3' && experienceYears >= 1 && experienceYears <= 3) ||
                             (filterExperience === '3-5' && experienceYears >= 3 && experienceYears <= 5) ||
                             (filterExperience === '5+' && experienceYears >= 5);
    
    // New Custom Filters
    const matchesCategories = selectedCategories.length === 0 || 
                             selectedCategories.some(cat => mechanic.specialty.toLowerCase().includes(cat.toLowerCase()));
    
    const matchesLocations = selectedLocations.length === 0 || 
                            selectedLocations.some(loc => mechanic.location.toLowerCase().includes(loc.toLowerCase()));
    
    const matchesServices = selectedServices.length === 0 || 
                           selectedServices.some(service => mechanic.services.includes(service));
    
    const matchesTimeAvailability = filterTimeAvailability === 'all' || 
                                   (filterTimeAvailability === '24_7' && mechanic.isAvailable); // Simplified for demo
    
    const matchesSpecialFeatures = filterSpecialFeatures.length === 0; // Simplified for demo
    
    return matchesSearch && matchesSpecialty && matchesDistance && matchesExperience && 
           matchesCategories && matchesLocations && matchesServices && matchesTimeAvailability && 
           matchesSpecialFeatures;
  });

  // Sort filtered mechanics
  const sortedMechanics = [...filteredMechanics].sort((a, b) => {
    switch (filterSortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'price_low':
        const priceA = parseInt(a.price.replace(/[^\d]/g, ''));
        const priceB = parseInt(b.price.replace(/[^\d]/g, ''));
        return priceA - priceB;
      case 'price_high':
        const priceAHigh = parseInt(a.price.replace(/[^\d]/g, ''));
        const priceBHigh = parseInt(b.price.replace(/[^\d]/g, ''));
        return priceBHigh - priceAHigh;
      case 'distance':
        const distanceA = parseFloat(a.distance.replace(/[^\d.]/g, ''));
        const distanceB = parseFloat(b.distance.replace(/[^\d.]/g, ''));
        return distanceA - distanceB;
      case 'experience':
        const expA = parseInt(a.experience.replace(/[^\d]/g, ''));
        const expB = parseInt(b.experience.replace(/[^\d]/g, ''));
        return expB - expA;
      default:
        return 0;
    }
  });

  const getSpecialtyIcon = (specialty: string) => {
    const spec = SPECIALTIES.find(s => s.id === specialty);
    return spec ? spec.icon : 'help-outline';
  };

  const getSpecialtyColor = (specialty: string) => {
    const colors: { [key: string]: string } = {
      'ელექტრიკოსი': '#6366F1',
      'მექანიკოსი': '#3B82F6',
      'დიაგნოსტიკა': '#22C55E',
      'კონდიციონერი': '#F59E0B',
      'საბურავების სპეციალისტი': '#EF4444',
    };
    return colors[specialty] || '#6B7280';
  };

  const resetFilters = () => {
    setFilterDistance(10);
    setFilterExperience('all');
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedServices([]);
    setFilterTimeAvailability('all');
    setFilterSpecialFeatures([]);
    setFilterSortBy('rating');
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ფილტრები</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Distance Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>მანძილი</Text>
              <View style={styles.distanceContainer}>
                <Text style={styles.filterDistanceText}>{filterDistance} კმ-ში</Text>
              </View>
            </View>

            {/* Experience Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>გამოცდილება</Text>
              <View style={styles.experienceContainer}>
                {[
                  { id: 'all', title: 'ყველა' },
                  { id: '1-3', title: '1-3 წელი' },
                  { id: '3-5', title: '3-5 წელი' },
                  { id: '5+', title: '5+ წელი' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.experienceOption,
                      filterExperience === option.id && styles.experienceOptionActive,
                    ]}
                    onPress={() => setFilterExperience(option.id)}
                  >
                    <Text style={[
                      styles.experienceOptionText,
                      filterExperience === option.id && styles.experienceOptionTextActive,
                    ]}>
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Categories Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>კატეგორიები</Text>
              <View style={styles.categoriesContainer}>
                {SPECIALTIES.slice(1).map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategories.includes(category.id) && styles.categoryChipActive,
                    ]}
                    onPress={() => {
                      if (selectedCategories.includes(category.id)) {
                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                      } else {
                        setSelectedCategories([...selectedCategories, category.id]);
                      }
                    }}
                  >
                    <Ionicons 
                      name={category.icon as any} 
                      size={16} 
                      color={selectedCategories.includes(category.id) ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.categoryChipText,
                      { color: selectedCategories.includes(category.id) ? '#FFFFFF' : '#6B7280' }
                    ]}>
                      {category.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Locations Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>მდებარეობა</Text>
              <View style={styles.locationsContainer}>
                {LOCATIONS.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={[
                      styles.locationChip,
                      selectedLocations.includes(location.id) && styles.locationChipActive,
                    ]}
                    onPress={() => {
                      if (selectedLocations.includes(location.id)) {
                        setSelectedLocations(selectedLocations.filter(id => id !== location.id));
                      } else {
                        setSelectedLocations([...selectedLocations, location.id]);
                      }
                    }}
                  >
                    <Ionicons 
                      name={location.icon as any} 
                      size={16} 
                      color={selectedLocations.includes(location.id) ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.locationChipText,
                      { color: selectedLocations.includes(location.id) ? '#FFFFFF' : '#6B7280' }
                    ]}>
                      {location.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Services Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>სერვისები</Text>
              <View style={styles.filterServicesContainer}>
                {ALL_SERVICES.slice(0, 8).map((service) => (
                  <TouchableOpacity
                    key={service}
                    style={[
                      styles.serviceChip,
                      selectedServices.includes(service) && styles.serviceChipActive,
                    ]}
                    onPress={() => {
                      if (selectedServices.includes(service)) {
                        setSelectedServices(selectedServices.filter(s => s !== service));
                      } else {
                        setSelectedServices([...selectedServices, service]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.serviceChipText,
                      { color: selectedServices.includes(service) ? '#FFFFFF' : '#6B7280' }
                    ]}>
                      {service}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Availability Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>დროის ხელმისაწვდომობა</Text>
              <View style={styles.timeAvailabilityContainer}>
                {TIME_AVAILABILITY.map((time) => (
                  <TouchableOpacity
                    key={time.id}
                    style={[
                      styles.timeOption,
                      filterTimeAvailability === time.id && styles.timeOptionActive,
                    ]}
                    onPress={() => setFilterTimeAvailability(time.id)}
                  >
                    <Ionicons 
                      name={time.icon as any} 
                      size={18} 
                      color={filterTimeAvailability === time.id ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.timeOptionText,
                      filterTimeAvailability === time.id && styles.timeOptionTextActive,
                    ]}>
                      {time.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Special Features Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>სპეციალური ფუნქციები</Text>
              <View style={styles.specialFeaturesContainer}>
                {SPECIAL_FEATURES.map((feature) => (
                  <TouchableOpacity
                    key={feature.id}
                    style={[
                      styles.featureChip,
                      filterSpecialFeatures.includes(feature.id) && styles.featureChipActive,
                    ]}
                    onPress={() => {
                      if (filterSpecialFeatures.includes(feature.id)) {
                        setFilterSpecialFeatures(filterSpecialFeatures.filter(id => id !== feature.id));
                      } else {
                        setFilterSpecialFeatures([...filterSpecialFeatures, feature.id]);
                      }
                    }}
                  >
                    <Ionicons 
                      name={feature.icon as any} 
                      size={16} 
                      color={filterSpecialFeatures.includes(feature.id) ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.featureChipText,
                      { color: filterSpecialFeatures.includes(feature.id) ? '#FFFFFF' : '#6B7280' }
                    ]}>
                      {feature.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>დალაგება</Text>
              <View style={styles.sortContainer}>
                {SORT_OPTIONS.map((sort) => (
                  <TouchableOpacity
                    key={sort.id}
                    style={[
                      styles.sortOption,
                      filterSortBy === sort.id && styles.sortOptionActive,
                    ]}
                    onPress={() => setFilterSortBy(sort.id)}
                  >
                    <Ionicons 
                      name={sort.icon as any} 
                      size={18} 
                      color={filterSortBy === sort.id ? '#FFFFFF' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.sortOptionText,
                      filterSortBy === sort.id && styles.sortOptionTextActive,
                    ]}>
                      {sort.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>გასუფთავება</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <LinearGradient
                colors={['#111827', '#374151']}
                style={styles.applyButtonGradient}
              >
                <Text style={styles.applyButtonText}>გამოყენება</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderMechanic = (mechanic: Mechanic) => (
    <TouchableOpacity key={mechanic.id} style={styles.mechanicCard}>
      <View style={styles.mechanicHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: mechanic.avatar }} style={styles.avatar} />
          {mechanic.isAvailable && (
            <View style={styles.availableIndicator} />
          )}
        </View>
        
        <View style={styles.mechanicInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.mechanicName}>{mechanic.name}</Text>
            <View style={[styles.specialtyBadge, { backgroundColor: getSpecialtyColor(mechanic.specialty) }]}>
              <Text style={styles.specialtyText}>{mechanic.specialty}</Text>
            </View>
          </View>
          
          <View style={styles.ratingRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{mechanic.rating}</Text>
              <Text style={styles.reviewsText}>({mechanic.reviews})</Text>
            </View>
            <Text style={styles.experienceText}>{mechanic.experience}</Text>
          </View>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.locationText}>{mechanic.location}</Text>
            <Text style={styles.distanceText}>• {mechanic.distance}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {mechanic.description}
      </Text>
      
      <View style={styles.servicesContainer}>
        {mechanic.services.slice(0, 3).map((service, index) => (
          <View key={index} style={styles.serviceTag}>
            <Text style={styles.serviceText}>{service}</Text>
          </View>
        ))}
        {mechanic.services.length > 3 && (
          <View style={styles.moreServices}>
            <Text style={styles.moreServicesText}>+{mechanic.services.length - 3}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.mechanicFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>ფასი:</Text>
          <Text style={styles.priceText}>{mechanic.price}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.contactButton, !mechanic.isAvailable && styles.contactButtonDisabled]}
          onPress={() => router.push(`/mechanic-detail?id=${mechanic.id}`)}
        >
          <Text style={[styles.contactButtonText, !mechanic.isAvailable && styles.contactButtonTextDisabled]}>
            {mechanic.isAvailable ? 'დაკავშირება' : 'მიუწვდომელი'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>ხელოსნები</Text>
            <Text style={styles.headerSubtitle}>{filteredMechanics.length} სპეციალისტი</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={24} color="#6B7280" />
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
            colors={['#111827']}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="ძებნა ხელოსნების..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Specialties */}
        <View style={styles.specialtiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtiesContent}>
            {SPECIALTIES.map((specialty) => (
              <TouchableOpacity
                key={specialty.id}
                style={[
                  styles.specialtyChip,
                  selectedSpecialty === specialty.id && styles.specialtyChipActive,
                ]}
                onPress={() => setSelectedSpecialty(specialty.id)}
              >
                <Ionicons 
                  name={specialty.icon as any} 
                  size={16} 
                  color={selectedSpecialty === specialty.id ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.specialtyChipText,
                  { color: selectedSpecialty === specialty.id ? '#FFFFFF' : '#6B7280' }
                ]}>
                  {specialty.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredMechanics.length} შედეგი
          </Text>
        </View>

        {/* Mechanics List */}
        <View style={styles.mechanicsContainer}>
          {sortedMechanics.map(renderMechanic)}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'NotoSans_500Medium',
  },
  specialtiesContainer: {
    paddingBottom: 16,
  },
  specialtiesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  specialtyChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  specialtyChipText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  mechanicsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  mechanicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mechanicHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  availableIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mechanicInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mechanicName: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#1F2937',
  },
  specialtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#1F2937',
  },
  reviewsText: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  experienceText: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  distanceText: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceText: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  moreServices: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moreServicesText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  mechanicFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  priceText: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#1F2937',
  },
  contactButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  contactButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  contactButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  contactButtonTextDisabled: {
    color: '#9CA3AF',
  },
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    minHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans_700Bold',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  filterRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  filterRatingText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  priceRangeContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  priceRangeText: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#1F2937',
  },
  distanceContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterDistanceText: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#1F2937',
  },
  availabilityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  availabilityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  availabilityOptionActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  availabilityOptionText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  availabilityOptionTextActive: {
    color: '#FFFFFF',
  },
  experienceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  experienceOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  experienceOptionActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  experienceOptionText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  experienceOptionTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  // New Custom Filter Styles
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
  },
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  locationChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  locationChipText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
  },
  filterServicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  serviceChipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  serviceChipText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
  },
  timeAvailabilityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
    minWidth: '45%',
  },
  timeOptionActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  timeOptionText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  timeOptionTextActive: {
    color: '#FFFFFF',
  },
  specialFeaturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  featureChipActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  featureChipText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
    flex: 1,
    minWidth: '45%',
  },
  sortOptionActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  sortOptionText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
  },
});
