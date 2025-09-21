import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import { useUser } from '../../contexts/UserContext';

const { width, height } = Dimensions.get('window');

// Mock user data for fallback
const MOCK_USER_DATA = {
  name: 'გიორგი მაისურაძე',
  email: 'giorgi@example.com',
  phone: '+995 599 123 456',
  avatar: null,
  avatarUri: null,
  totalBookings: 24,
  totalSpent: '320₾',
  memberSince: '2023 წლის მარტი',
  rating: 4.8,
  favoriteService: 'Premium Car Wash',
};

const PROFILE_MENU_ITEMS = [
  {
    id: '1',
    title: 'პირადი ინფორმაცია',
    subtitle: 'სახელი, ელ-ფოსტა, ტელეფონი',
    icon: 'person-outline',
    color: '#3B82F6',
  },
  {
    id: 'loyalty',
    title: 'ლოიალობის პროგრამა',
    subtitle: 'ქულები, ჯილდოები და ფასდაკლებები',
    icon: 'star-outline',
    color: '#F59E0B',
  },
  {
    id: 'partner',
    title: 'პარტნიორი მაღაზიები',
    subtitle: 'შეთავაზებები და ფასდაკლებები',
    icon: 'storefront-outline',
    color: '#22C55E',
  },
  {
    id: '9',
    title: 'მხარდაჭერა',
    subtitle: '24/7 მხარდაჭერა ჩატში',
    icon: 'headset-outline',
    color: '#EC4899',
  },
  {
    id: '2',
    title: 'ჩემი მანქანები',
    subtitle: 'დაამატეთ ან შეცვალეთ მანქანები',
    icon: 'car-outline',
    color: '#10B981',
  },
  {
    id: '3',
    title: 'გადახდის მეთოდები',
    subtitle: 'ბარათები, ბანკის ანგარიშები',
    icon: 'card-outline',
    color: '#F59E0B',
  },
  {
    id: '4',
    title: 'შეფასებები',
    subtitle: 'თქვენი შეფასებები სერვისებისთვის',
    icon: 'star-outline',
    color: '#8B5CF6',
  },
  {
    id: '5',
    title: 'შეტყობინებები',
    subtitle: 'შეტყობინებები და ნოტიფიკაციები',
    icon: 'chatbubble-outline',
    color: '#EF4444',
  },
  
  {
    id: '7',
    title: 'პარამეტრები',
    subtitle: 'აპლიკაციის პარამეტრები',
    icon: 'settings-outline',
    color: '#374151',
  },
  {
    id: '8',
    title: 'დაგვიკავშირდით',
    subtitle: 'ელ-ფოსტა, ტელეფონი, ჩატი',
    icon: 'mail-outline',
    color: '#06B6D4',
  },
  
];

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useUser();
  const [pressedButtons, setPressedButtons] = useState<{ [key: string]: boolean }>({});
  const [userAvatar, setUserAvatar] = useState(MOCK_USER_DATA.avatarUri);


  // Use real user data or fallback to mock data
  const displayName = user?.name || MOCK_USER_DATA.name;
  const displayPhone = user?.phone || MOCK_USER_DATA.phone;
  const displayEmail = user?.email || MOCK_USER_DATA.email;
  const memberSince = MOCK_USER_DATA.memberSince; // User interface doesn't have createdAt

  const handlePhotoUpload = () => {
    Alert.alert(
      'ფოტოს ატვირთვა',
      'აირჩიეთ ფოტოს ატვირთვის მეთოდი',
      [
        {
          text: 'კამერა',
          onPress: () => handleCameraUpload(),
        },
        {
          text: 'გალერეა',
          onPress: () => handleGalleryUpload(),
        },
        {
          text: 'გაუქმება',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCameraUpload = () => {
    console.log('Camera upload pressed');
    // Here you would implement camera functionality
    // For now, just show a success message
    Alert.alert('წარმატება', 'კამერა გაიხსნა ფოტოს ასაღებად');
  };

  const handleGalleryUpload = () => {
    console.log('Gallery upload pressed');
    // Here you would implement gallery picker functionality
    // For now, just show a success message
    Alert.alert('წარმატება', 'გალერეა გაიხსნა ფოტოს ასარჩევად');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#0A0A0A' : '#F8FAFC',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      paddingBottom: 20,
      backgroundColor: colorScheme === 'dark' ? '#0A0A0A' : '#F8FAFC',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'Poppins_700Bold',
      color: colors.text,
      letterSpacing: -0.5,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    },
    settingsButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 0,
      paddingBottom: 20,
    },
    profileCard: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      width: '100%',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
      position: 'relative',
    },
    avatarText: {
      fontSize: 24,
      fontFamily: 'Poppins_700Bold',
      color: '#FFFFFF',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 20,
      fontFamily: 'Poppins_700Bold',
      color: colors.text,
      marginBottom: 2,
      lineHeight: 26,
    },
    profileEmail: {
      fontSize: 14,
      fontFamily: 'Poppins_400Regular',
      color: colors.secondary,
      marginBottom: 4,
    },
    profilePhone: {
      fontSize: 13,
      fontFamily: 'Poppins_500Medium',
      color: colors.secondary,
      opacity: 0.8,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    statItem: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    statValue: {
      fontSize: 20,
      fontFamily: 'Poppins_700Bold',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Poppins_500Medium',
      color: colors.secondary,
      textAlign: 'center',
      opacity: 0.8,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    ratingText: {
      fontSize: 14,
      fontFamily: 'Poppins_600SemiBold',
      color: colors.text,
      marginRight: 8,
    },
    starsContainer: {
      flexDirection: 'row',
      gap: 2,
    },
    menuSection: {
      marginBottom: 20,
    },
    menuTitle: {
      fontSize: 18,
      fontFamily: 'Poppins_600SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    menuItem: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
    },
    menuItemPressed: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)',
      transform: [{ scale: 0.98 }],
    },
    menuItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 15,
      fontFamily: 'Poppins_600SemiBold',
      color: colors.text,
      marginBottom: 1,
    },
    menuItemSubtitle: {
      fontSize: 13,
      fontFamily: 'Poppins_400Regular',
      color: colors.secondary,
      opacity: 0.8,
    },
    menuItemArrow: {
      marginLeft: 8,
    },
    logoutButton: {
      backgroundColor: '#EF4444',
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    logoutButtonText: {
      fontSize: 15,
      fontFamily: 'Poppins_600SemiBold',
      color: '#FFFFFF',
    },
    contactContainer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    contactTitle: {
      fontSize: 16,
      fontFamily: 'Poppins_600SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    contactButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    contactButton: {
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 12,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      minWidth: 80,
    },
    contactButtonText: {
      fontSize: 13,
      fontFamily: 'Poppins_500Medium',
      color: colors.primary,
      marginTop: 5,
    },
    cameraIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 10,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  const handleMenuItemPress = (item: any) => {
    console.log('Menu item pressed:', item.title);
    
    // Handle specific menu items
    if (item.id === 'loyalty') {
      // Navigate to loyalty page
      router.push('/loyalty');
    } else if (item.id === 'partner') {
      // Navigate to partner page
      router.push('/partner');
    } else if (item.id === '8') {
      // Contact us options
      handleContactOptions();
    } else if (item.id === '9') {
      // Support chat
      handleSupportChat();
    } else {
      // Handle other menu items
      console.log('Navigating to:', item.title);
    }
  };

  const handleContactOptions = () => {
    // Show contact options modal or navigate to contact page
    console.log('Contact options opened');
    // Here you can add modal or navigation logic
  };

  const handleSupportChat = () => {
    // Open support chat
    console.log('Support chat opened');
    // Here you can integrate with chat service
  };

  const handleLogout = async () => {
    Alert.alert(
      'გასვლა',
      'დარწმუნებული ხართ რომ გსურთ გასვლა?',
      [
        {
          text: 'გაუქმება',
          style: 'cancel',
        },
        {
          text: 'გასვლა',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? '#FBBF24' : colors.secondary}
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>პროფილი</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePhotoUpload}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={{ width: '100%', height: '100%', borderRadius: 30 }} />
              ) : (
                <Text style={styles.avatarText}>
                  {displayName.charAt(0)}
                </Text>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{displayEmail}</Text>
              <Text style={styles.profilePhone}>{displayPhone}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{MOCK_USER_DATA.totalBookings}</Text>
              <Text style={styles.statLabel}>ჯავშნები</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{MOCK_USER_DATA.totalSpent}</Text>
              <Text style={styles.statLabel}>დახარჯული</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{MOCK_USER_DATA.rating}</Text>
              <Text style={styles.statLabel}>შეფასება</Text>
            </View>
          </View>

         

          {/* Contact Information */}
          
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>პარამეტრები</Text>
          {PROFILE_MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                pressedButtons[item.id] && styles.menuItemPressed
              ]}
              onPress={() => handleMenuItemPress(item)}
              onPressIn={() => setPressedButtons(prev => ({ ...prev, [item.id]: true }))}
              onPressOut={() => setPressedButtons(prev => ({ ...prev, [item.id]: false }))}
              activeOpacity={0.8}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.menuItemArrow}>
                <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutButton]}
            onPress={handleLogout}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: '#EF4444' }]}>გასვლა</Text>
              <Text style={styles.menuItemSubtitle}>გამოხვიდეთ ანგარიშიდან</Text>
            </View>
            <View style={styles.menuItemArrow}>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
