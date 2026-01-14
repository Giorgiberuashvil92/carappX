import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useUser } from '@/contexts/UserContext';
import { aiApi } from '@/services/aiApi';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);
  const router = useRouter();
  const { user } = useUser();
  const [showAIModal, setShowAIModal] = useState(false);
  const [sellerStatus, setSellerStatus] = useState<any>(null);

  // Load seller status when component mounts
  useEffect(() => {
    if (user?.id) {
      loadSellerStatus();
    }
  }, [user?.id]);

  const loadSellerStatus = async () => {
    if (!user?.id) return;
    try {
      const res = await aiApi.getSellerStatus({
        userId: user.id,
        phone: user.phone,
      });
      setSellerStatus(res.data);
    } catch (e) {
      console.log('[CustomTabBar] Failed to load seller status:', e);
    }
  };

  const hasStore =
    !!(sellerStatus?.counts?.stores && sellerStatus.counts.stores > 0) ||
    !!(sellerStatus?.ownedStores && sellerStatus.ownedStores.length > 0);
  const hasDismantlers =
    !!(sellerStatus?.counts?.dismantlers && sellerStatus.counts.dismantlers > 0) ||
    !!(sellerStatus?.ownedDismantlers && sellerStatus.ownedDismantlers.length > 0);
  const hasSellerAssets =
    hasStore ||
    hasDismantlers ||
    !!(sellerStatus?.ownedParts && sellerStatus.ownedParts.length > 0);

  const handleAIButtonPress = () => {
    if (hasSellerAssets) {
      setShowAIModal(true);
    } else {
      router.push('/(tabs)/ai' as any);
    }
  };

  // Hide tab bar on profile screen (two)
  const currentRoute = state.routes[state.index];
  if (currentRoute.name === 'two') {
    return null;
  }

  const goTo = (routeName: string, index: number) => {
    const isFocused = state.index === index;
    if (!isFocused) {
      navigation.navigate(routeName);
    }
  };

  // Only show specific routes in tab bar
  const allowedRoutes = ['index', 'garage', 'marketplace', 'community'];
  const visibleRoutes = state.routes.filter((route) => {
    return allowedRoutes.includes(route.name);
  });
  

  const tabItems = visibleRoutes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
        ? options.title
        : route.name;
    const originalIndex = state.routes.findIndex(r => r.key === route.key);
    const isFocused = state.index === originalIndex;
    const iconName = (options.tabBarIcon as any)?.({ color: '#000' })?.props?.name as React.ComponentProps<typeof FontAwesome>['name'] | undefined;

    // Center slot is reserved for the floating action button
    return (
      <TouchableOpacity key={route.key} accessibilityRole="button" activeOpacity={0.9} style={styles.tabItem} onPress={() => goTo(route.name, originalIndex)}>
        {iconName && <FontAwesome name={iconName} size={18} color={isFocused ? theme.text : theme.secondary} />}
        <Text style={[styles.tabText, { color: isFocused ? theme.text : theme.secondary }]} numberOfLines={1}>
          {String(label)}
        </Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        <View style={styles.side}>{tabItems.slice(0, 2)}</View>
        <View style={styles.fabHole} />
        <View style={styles.side}>{tabItems.slice(2)}</View>
      </View>
      <TouchableOpacity activeOpacity={0.9} style={styles.fab} onPress={handleAIButtonPress}>
        <FontAwesome name="bolt" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* AI Selection Modal */}
      <Modal
        visible={showAIModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowAIModal(false)}
        >
          <Pressable 
            style={styles.panelModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>რას გააკეთებთ?</Text>
              <Text style={styles.modalSubtitle}>
                აირჩიეთ AI მოთხოვნა ან თქვენი ბიზნესის მართვა
              </Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {/* AI Request Option - ყოველთვის ჩანს */}
              <Pressable
                style={[styles.optionCard, styles.aiOptionCard]}
                onPress={() => {
                  setShowAIModal(false);
                  router.push('/(tabs)/ai' as any);
                }}
              >
                <View style={styles.optionIconWrapper}>
                  <View style={[styles.optionIconBg, { backgroundColor: '#4F46E5' }]}>
                    <Ionicons name="flash" size={28} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.optionTitle}>AI მოთხოვნა</Text>
                <Text style={styles.optionDescription}>
                  იპოვე ნაწილი ხელოვნური ინტელექტის დახმარებით
                </Text>
                <View style={styles.optionArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#4F46E5" />
                </View>
              </Pressable>

              {/* Business Panel Option - მხოლოდ თუ აქვს seller assets */}
              {(hasStore || hasDismantlers) && (
                <Pressable
                  style={[styles.optionCard, styles.businessOptionCard]}
                  onPress={() => {
                    setShowAIModal(false);
                    // თუ აქვს დაშლილები, გადავიყვანოთ dismantler-dashboard-ზე
                    // თუ მხოლოდ store აქვს, partner-dashboard-ზე
                    if (hasDismantlers) {
                      router.push('/dismantler-dashboard' as any);
                    } else {
                      router.push('/partner-dashboard-store' as any);
                    }
                  }}
                >
                  <View style={styles.optionIconWrapper}>
                    <View style={[styles.optionIconBg, { backgroundColor: '#10B981' }]}>
                      <Ionicons name="construct" size={28} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.optionTitle}>ბიზნესის მართვა</Text>
                  <Text style={styles.optionDescription}>
                    {hasDismantlers ? 'დაშლილების' : 'მაღაზიის'} მოთხოვნები და ჩატები
                  </Text>
                  <View style={styles.optionArrow}>
                    <Ionicons name="arrow-forward" size={20} color="#10B981" />
                  </View>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(theme: typeof Colors.light) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: Platform.select({ ios: 12, android: 12 })!,
      alignItems: 'center',
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
      height: 70,
      width: '92%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 6,
    },
    side: { flexDirection: 'row', gap: 24, alignItems: 'center' },
    fabHole: { width: 64 },
    tabItem: { alignItems: 'center', justifyContent: 'center' },
    tabText: { fontFamily: 'Outfit', fontSize: 11, marginTop: 4 },
    fab: {
      position: 'absolute',
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#111827',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    panelModalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingBottom: Platform.select({ ios: 40, android: 24 }),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 10,
    },
    modalHeader: {
      paddingTop: 16,
      paddingHorizontal: 24,
      paddingBottom: 24,
      alignItems: 'center',
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: '#E5E7EB',
      borderRadius: 2,
      marginBottom: 20,
    },
    modalTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 24,
      color: '#111827',
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 15,
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 22,
    },
    optionsContainer: {
      paddingHorizontal: 24,
      gap: 16,
    },
    optionCard: {
      backgroundColor: '#F9FAFB',
      borderRadius: 20,
      padding: 24,
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
      overflow: 'hidden',
    },
    aiOptionCard: {
      borderColor: '#4F46E5',
      backgroundColor: '#EEF2FF',
    },
    businessOptionCard: {
      borderColor: '#10B981',
      backgroundColor: '#ECFDF5',
    },
    optionIconWrapper: {
      marginBottom: 16,
    },
    optionIconBg: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    optionTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 20,
      color: '#111827',
      marginBottom: 8,
    },
    optionDescription: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
    },
    optionArrow: {
      position: 'absolute',
      top: 24,
      right: 24,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  });
}


