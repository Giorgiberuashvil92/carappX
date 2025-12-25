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
  StatusBar,
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
  
  // {
  //   id: '9',
  //   title: 'მხარდაჭერა',
  //   subtitle: '24/7 მხარდაჭერა ჩატში',
  //   icon: 'headset-outline',
  //   color: '#EC4899',
  // },
  {
    id: '2',
    title: 'ჩემი მანქანები',
    subtitle: 'დაამატეთ ან შეცვალეთ მანქანები',
    icon: 'car-outline',
    color: '#10B981',
  },
  // {
  //   id: '8',
  //   title: 'დაგვიკავშირდით',
  //   subtitle: 'ელ-ფოსტა, ტელეფონი, ჩატი',
  //   icon: 'mail-outline',
  //   color: '#06B6D4',
  // },
  
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
    Alert.alert('წარმატება', 'კამერა გაიხსნა ფოტოს ასაღებად');
  };

  const handleGalleryUpload = () => {
    console.log('Gallery upload pressed');
    Alert.alert('წარმატება', 'გალერეა გაიხსნა ფოტოს ასარჩევად');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    // Modern Header - Airbnb style
    modernHeader: {
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 24,
      paddingHorizontal: 20,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '500',
      color: '#111827',
      letterSpacing: -0.5,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: '#F9FAFB',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    settingsButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: '#F9FAFB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerProfileSection: {
      alignItems: 'center',
    },
    largeAvatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 16,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      borderWidth: 3,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    largeAvatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 37,
    },
    largeAvatarText: {
      fontSize: 24,
      fontWeight: '700',
      color: '#6366F1',
    },
    cameraIconLarge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#111827',
      borderRadius: 12,
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    headerProfileInfo: {
      alignItems: 'center',
    },
    headerProfileName: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 6,
      textAlign: 'center',
    },
    headerProfileEmail: {
      fontSize: 14,
      fontWeight: '400',
      color: '#6B7280',
      marginBottom: 12,
      textAlign: 'center',
    },
    
    memberSinceText: {
      fontSize: 13,
      fontWeight: '500',
      color: '#6B7280',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
   
   
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: '#6B7280',
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    menuSection: {
      marginBottom: 20,
    },
    menuTitleContainer: {
      marginBottom: 16,
    },
    menuTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
    },
    menuTitleUnderline: {
      width: 40,
      height: 2,
      backgroundColor: '#111827',
      borderRadius: 1,
    },
    menuItem: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    menuItemPressed: {
      backgroundColor: '#F9FAFB',
      transform: [{ scale: 0.98 }],
    },
    menuItemIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
    },
    menuItemSubtitle: {
      fontSize: 12,
      fontWeight: '400',
      color: '#6B7280',
    },
    menuItemArrow: {
      marginLeft: 8,
      opacity: 0.4,
    },
    logoutButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#EF4444',
    },
  });

  const handleMenuItemPress = (item: any) => {
    console.log('Menu item pressed:', item.title);
    
    // Handle specific menu items
    if (item.id === '1') {
      router.push('/personal-info');
      return;
    }
    if (item.id === '2') {
      router.push('/(tabs)/garage');
      return;
    }
    if (item.id === 'loyalty') {
      router.push('/loyalty');
    } else if (item.id === 'partner') {
      router.push('/partner');
    } else if (item.id === '8') {
      handleContactOptions();
    } else if (item.id === '9') {
      handleSupportChat();
    } else {
      console.log('Navigating to:', item.title);
    }
  };

  const handleContactOptions = () => {
    console.log('Contact options opened');
  };

  const handleSupportChat = () => {
    console.log('Support chat opened');
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />
      
      {/* Modern White Header - Airbnb style */}
      <View style={styles.modernHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>პროფილი</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.headerProfileSection}>
          <TouchableOpacity style={styles.largeAvatarContainer} onPress={handlePhotoUpload}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.largeAvatarImage} />
            ) : (
              <Text style={styles.largeAvatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
            <View style={styles.cameraIconLarge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerProfileInfo}>
            <Text style={styles.headerProfileName}>{displayName}</Text>
            <Text style={styles.headerProfileEmail}>{displayEmail || displayPhone}</Text>
          
          </View>
        </View>

      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {/* Menu Items */}
        <View style={styles.menuSection}>
          
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
              <View style={[styles.menuItemIcon, { backgroundColor: '#F9FAFB' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.menuItemArrow}>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutButton]}
            onPress={handleLogout}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: '#EF4444' }]}>გასვლა</Text>
              <Text style={styles.menuItemSubtitle}>გამოხვიდეთ ანგარიშიდან</Text>
            </View>
            <View style={styles.menuItemArrow}>
              <Ionicons name="chevron-forward" size={18} color="#EF4444" />
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
