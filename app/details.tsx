import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Platform, 
  StatusBar, 
  Dimensions, 
  Animated, 
  Share, 
  Linking,
  ImageBackground,
  ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // სერვისის ტიპის განსაზღვრება
  const serviceType = (params.type as string) || 'carwash';
  const title = (params.title as string) || getDefaultTitle(serviceType);
  const latitude = Number(params.lat ?? 41.7151);
  const longitude = Number(params.lng ?? 44.8271);
  
  const [activeTab, setActiveTab] = useState('details');
  const [isLiked, setIsLiked] = useState(false);
  const [serviceData, setServiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // სერვისის ტიპის მიხედვით default title-ის მიღება
  function getDefaultTitle(type: string): string {
    switch (type) {
      case 'carwash':
        return 'სტანდარტული რეცხვის სერვისი';
      case 'mechanic':
        return 'ავტო სერვისი';
      case 'store':
        return 'ავტო ნაწილების მაღაზია';
      default:
        return 'სერვისი';
    }
  }

  // სერვისის ტიპის მიხედვით default services-ის მიღება
  function getDefaultServices(type: string): string[] {
    switch (type) {
      case 'carwash':
        return ['შიდა რეცხვა', 'გარე რეცხვა', 'ვაკუუმი', 'ცვილის ფენა'];
      case 'mechanic':
        return ['ძრავის შემოწმება', 'საბურავების შეცვლა', 'ბრეიკების შემოწმება', 'ზეთის შეცვლა'];
      case 'store':
        return ['ავტო ნაწილები', 'საბურავები', 'ზეთი', 'ფილტრები'];
      default:
        return ['სერვისი 1', 'სერვისი 2', 'სერვისი 3'];
    }
  }

  // სერვისის ტიპის მიხედვით default features-ის მიღება
  function getDefaultFeatures(type: string): string[] {
    switch (type) {
      case 'carwash':
        return ['WiFi', 'პარკინგი', 'ღამის სერვისი', 'ბარათით გადახდა', 'დაზღვეული', 'VIP ოთახი'];
      case 'mechanic':
        return ['პროფესიონალური', 'ორიგინალური ნაწილები', 'გარანტია', 'სწრაფი მომსახურება', 'დიაგნოსტიკა'];
      case 'store':
        return ['ორიგინალური ნაწილები', 'მიწოდება', 'გარანტია', 'კონსულტაცია', 'ფასდაკლებები'];
      default:
        return ['ხარისხიანი', 'სწრაფი', 'ზუსტი'];
    }
  }

  // feature-ის მიხედვით icon-ის მიღება
  function getFeatureIcon(feature: string): string {
    const iconMap: { [key: string]: string } = {
      'WiFi': 'wifi',
      'პარკინგი': 'car',
      'ღამის სერვისი': 'moon',
      'ბარათით გადახდა': 'card',
      'დაზღვეული': 'shield-checkmark',
      'VIP ოთახი': 'people',
      'პროფესიონალური': 'construct',
      'ორიგინალური ნაწილები': 'cube',
      'გარანტია': 'shield-checkmark',
      'სწრაფი მომსახურება': 'flash',
      'დიაგნოსტიკა': 'analytics',
      'მიწოდება': 'car-sport',
      'კონსულტაცია': 'chatbubble',
      'ფასდაკლებები': 'pricetag',
      'ხარისხიანი': 'star',
      'სწრაფი': 'flash',
      'ზუსტი': 'checkmark-circle'
    };
    return iconMap[feature] || 'checkmark';
  }

  // feature-ის მიხედვით color-ის მიღება
  function getFeatureColor(feature: string): string {
    const colorMap: { [key: string]: string } = {
      'WiFi': '#10B981',
      'პარკინგი': '#6366F1',
      'ღამის სერვისი': '#8B5CF6',
      'ბარათით გადახდა': '#F59E0B',
      'დაზღვეული': '#EF4444',
      'VIP ოთახი': '#EC4899',
      'პროფესიონალური': '#3B82F6',
      'ორიგინალური ნაწილები': '#10B981',
      'გარანტია': '#EF4444',
      'სწრაფი მომსახურება': '#F59E0B',
      'დიაგნოსტიკა': '#8B5CF6',
      'მიწოდება': '#6366F1',
      'კონსულტაცია': '#EC4899',
      'ფასდაკლებები': '#EF4444',
      'ხარისხიანი': '#F59E0B',
      'სწრაფი': '#10B981',
      'ზუსტი': '#6366F1'
    };
    return colorMap[feature] || '#6B7280';
  }

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const opacity = Math.max(0, 1 - value / 200);
      headerOpacity.setValue(opacity);
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, []);

  // API-დან სერვისის დეტალების მიღება
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        const serviceId = params.id as string;
        
        console.log('🔍 [DETAILS] Using params data for service details');
        console.log('🔍 [DETAILS] Service type:', serviceType);
        console.log('🔍 [DETAILS] Params:', params);
        
        // Parse services from params - check if detailedServices exists first
        let servicesToUse;
        if (params.detailedServices) {
          try {
            const detailedServices = JSON.parse(params.detailedServices as string);
            console.log('🔍 [DETAILS] Parsed detailedServices:', detailedServices);
            
            if (detailedServices && Array.isArray(detailedServices) && detailedServices.length > 0) {
              // Use detailed services from backend
              servicesToUse = detailedServices.map((service: any) => ({
                id: service.id || Math.random().toString(),
                name: service.name,
                price: `${service.price}₾`,
                duration: `${service.duration} წთ`,
                popular: service.popular || false
              }));
              console.log('🔍 [DETAILS] Using detailed services:', servicesToUse);
            } else {
              throw new Error('detailedServices is empty');
            }
          } catch (error) {
            console.log('🔍 [DETAILS] Error parsing detailedServices, falling back to regular services');
            // Fallback to regular services
            const defaultServices = getDefaultServices(serviceType);
            const servicesFromParams = params.services ? JSON.parse(params.services as string) : defaultServices;
            servicesToUse = servicesFromParams.map((service: string, index: number) => ({
              id: index + 1,
              name: service,
              price: `${15 + index * 5}₾`,
              duration: `${20 + index * 10} წთ`,
              popular: index < 2
            }));
          }
        } else {
          // Use regular services
          const defaultServices = getDefaultServices(serviceType);
          const servicesFromParams = params.services ? JSON.parse(params.services as string) : defaultServices;
          servicesToUse = servicesFromParams.map((service: string, index: number) => ({
            id: index + 1,
            name: service,
            price: `${15 + index * 5}₾`,
            duration: `${20 + index * 10} წთ`,
            popular: index < 2
          }));
        }
        
        console.log('🔍 [DETAILS] Final services to use:', servicesToUse);
        setServices(servicesToUse);
        
        // Parse features from params
        let featuresToUse;
        if (params.features) {
          const featuresFromParams = params.features as string;
          console.log('🔍 [DETAILS] Raw features from params:', featuresFromParams);
          
          if (featuresFromParams.includes(',')) {
            // Features is a comma-separated string
            featuresToUse = featuresFromParams.split(',').map(f => f.trim()).filter(Boolean);
            console.log('🔍 [DETAILS] Parsed comma-separated features:', featuresToUse);
          } else {
            // Try to parse as JSON
            try {
              featuresToUse = JSON.parse(featuresFromParams);
              console.log('🔍 [DETAILS] Parsed JSON features:', featuresToUse);
            } catch {
              featuresToUse = [featuresFromParams];
              console.log('🔍 [DETAILS] Single feature:', featuresToUse);
            }
          }
        } else {
          featuresToUse = getDefaultFeatures(serviceType);
          console.log('🔍 [DETAILS] Using default features:', featuresToUse);
        }
        
        const finalFeatures = featuresToUse.map((feature: string, index: number) => ({
          id: index + 1,
          name: feature,
          icon: getFeatureIcon(feature),
          color: getFeatureColor(feature)
        }));
        
        console.log('🔍 [DETAILS] Final features to use:', finalFeatures);
        setFeatures(finalFeatures);
        
        // Mock reviews
        setReviews([
          { id: 1, name: 'გიორგი ბერიძე', rating: 5, comment: 'ძალიან კარგი სერვისი, სწრაფი და ხარისხიანი!', date: '2 დღის წინ' },
          { id: 2, name: 'მარიამ კვარაცხელია', rating: 4, comment: 'კარგია, მაგრამ ცოტა ძვირი. რეკომენდაცია ღირს.', date: '1 კვირის წინ' },
          { id: 3, name: 'ნიკოლოზ კაპანაძე', rating: 5, comment: 'უმაღლესი ხარისხი! ყოველთვის აქ მოვდივარ.', date: '2 კვირის წინ' }
        ]);
        
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error fetching service details:', error);
        // Use fallback data on error
        setServiceData({
          id: params.id || '1',
          name: title,
          address: params.address || 'თბილისი, ვაკე',
          rating: 4.9,
          reviews: 89,
          distance: '1.2 კმ',
          price: '15₾',
          image: params.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
          category: 'Premium',
          isOpen: true,
          waitTime: '10 წთ',
          description: 'პრემიუმ ხარისხის მომსახურება, სწრაფად და უსაფრთხოდ.',
          phone: '+995 32 123 4567',
          workingHours: '09:00 - 18:00',
        });
        
        // Fallback services based on service type
        const fallbackServices = getDefaultServices(serviceType);
        setServices(fallbackServices.map((service, index) => ({
          id: index + 1,
          name: service,
          price: `${15 + index * 5}₾`,
          duration: `${20 + index * 10} წთ`,
          popular: index < 2
        })));
        
        // Fallback features based on service type
        const fallbackFeatures = getDefaultFeatures(serviceType);
        setFeatures(fallbackFeatures.map((feature, index) => ({
          id: index + 1,
          name: feature,
          icon: getFeatureIcon(feature),
          color: getFeatureColor(feature)
        })));
        
        // Fallback reviews
        setReviews([
          { id: 1, name: 'გიორგი ბერიძე', rating: 5, comment: 'ძალიან კარგი სერვისი, სწრაფი და ხარისხიანი!', date: '2 დღის წინ' },
          { id: 2, name: 'მარიამ კვარაცხელია', rating: 4, comment: 'კარგია, მაგრამ ცოტა ძვირი. რეკომენდაცია ღირს.', date: '1 კვირის წინ' },
          { id: 3, name: 'ნიკოლოზ კაპანაძე', rating: 5, comment: 'უმაღლესი ხარისხი! ყოველთვის აქ მოვდივარ.', date: '2 კვირის წინ' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, []); // მხოლოდ ერთხელ გაეშვას

  const handleShare = async () => {
    try {
      await Share.share({
        message: `შეამოწმეთ ${title} - ${params.address || 'თბილისი'}`,
        title: title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCall = () => {
    const phoneNumber = params.phone as string;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleDirections = () => {
    const url = `https://maps.google.com/maps?daddr=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
      <ImageBackground
        source={{ uri: params.image as string || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop' }}
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <LinearGradient 
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']} 
          style={StyleSheet.absoluteFill} 
        />
        
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerRightButtons}>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={() => setIsLiked(!isLiked)}
              >
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? "#EF4444" : "#FFFFFF"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.headerBottom}>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: params.isOpen === 'true' ? '#10B981' : '#EF4444' }
              ]} />
              <Text style={styles.statusText}>
                {params.isOpen === 'true' ? 'ღიაა' : 'დახურულია'}
              </Text>
            </View>
            
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{params.rating || '4.9'}</Text>
              <Text style={styles.reviewsText}>({params.reviews || '89'} რევიუ)</Text>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </Animated.View>
  );

  const renderInfoCard = () => (
    <View style={styles.infoCard}>
      <Text style={styles.title}>{serviceData?.name || title}</Text>
      
      <View style={styles.quickInfo}>
        <View style={styles.quickInfoItem}>
          <Ionicons name="location" size={18} color="#6366F1" />
          <Text style={styles.quickInfoText}>{serviceData?.distance || params.distance || '1.2 კმ'}</Text>
        </View>
        <View style={styles.quickInfoItem}>
          <Ionicons name="time" size={18} color="#10B981" />
          <Text style={styles.quickInfoText}>{serviceData?.waitTime || params.waitTime || '10 წთ'}</Text>
        </View>
        <View style={styles.quickInfoItem}>
          <Ionicons name="car" size={18} color="#F59E0B" />
          <Text style={styles.quickInfoText}>{serviceData?.category || params.category || 'Premium'}</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'details' && styles.activeTab]}
        onPress={() => setActiveTab('details')}
      >
        <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
          დეტალები
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'services' && styles.activeTab]}
        onPress={() => setActiveTab('services')}
      >
        <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
          სერვისები
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
        onPress={() => setActiveTab('reviews')}
      >
        <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
          რევიუები
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailsContent = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>აღწერა</Text>
        <Text style={styles.description}>
          {serviceData?.description || params.description || 'პრემიუმ ხარისხის მომსახურება, სწრაფად და უსაფრთხოდ. ჩვენი პროფესიონალური გუნდი უზრუნველყოფს შენი მანქანის სრულ გაწმენდას ყველაზე მოდერნული ტექნოლოგიების გამოყენებით.'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>მისამართი</Text>
        <TouchableOpacity style={styles.addressCard} onPress={handleDirections}>
          <View style={styles.addressContent}>
            <View style={styles.addressIcon}>
              <Ionicons name="location" size={20} color="#6366F1" />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressText}>{serviceData?.address || params.address || 'თბილისი, ვაკე'}</Text>
              <Text style={styles.directionsText}>დააჭირეთ რუკაზე გადასასვლელად</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ფუნქციები</Text>
        <View style={styles.featuresGrid}>
          {features.length > 0 ? features.map((feature, index) => (
            <View key={feature.id || index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                <Ionicons name={feature.icon as any} size={20} color={feature.color} />
              </View>
              <Text style={styles.featureText}>{feature.name}</Text>
            </View>
          )) : [
            { icon: 'wifi', text: 'WiFi', color: '#10B981' },
            { icon: 'car', text: 'პარკინგი', color: '#6366F1' },
            { icon: 'moon', text: 'ღამის სერვისი', color: '#8B5CF6' },
            { icon: 'card', text: 'ბარათით გადახდა', color: '#F59E0B' },
            { icon: 'shield-checkmark', text: 'დაზღვეული', color: '#EF4444' },
            { icon: 'people', text: 'VIP ოთახი', color: '#EC4899' }
          ].map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                <Ionicons name={feature.icon as any} size={20} color={feature.color} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderServicesContent = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ხელმისაწვდომი სერვისები</Text>
        <View style={styles.servicesList}>
          {services.length > 0 ? services.map((service, index) => (
            <View key={service.id || index} style={styles.serviceCard}>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {service.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>პოპულარული</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.serviceDuration}>{service.duration}</Text>
              </View>
              <View style={styles.servicePrice}>
                <Text style={styles.priceText}>{service.price}</Text>
              </View>
            </View>
          )) : [
            { name: 'შიდა რეცხვა', price: '15₾', duration: '30 წთ', popular: true },
            { name: 'გარე რეცხვა', price: '20₾', duration: '45 წთ', popular: false },
            { name: 'ვაკუუმი', price: '10₾', duration: '15 წთ', popular: false },
            { name: 'ცვილის ფენა', price: '50₾', duration: '60 წთ', popular: true },
            { name: 'ძრავის გაწმენდა', price: '25₾', duration: '40 წთ', popular: false },
            { name: 'საბურავების გაწმენდა', price: '8₾', duration: '10 წთ', popular: false }
          ].map((service, index) => (
            <View key={index} style={styles.serviceCard}>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {service.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>პოპულარული</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.serviceDuration}>{service.duration}</Text>
              </View>
              <View style={styles.servicePrice}>
                <Text style={styles.priceText}>{service.price}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderReviewsContent = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>რევიუები</Text>
          <View style={styles.ratingSummary}>
            <Text style={styles.ratingNumber}>{params.rating || '4.9'}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons 
                  key={star} 
                  name="star" 
                  size={16} 
                  color="#F59E0B" 
                />
              ))}
            </View>
            <Text style={styles.totalReviews}>({params.reviews || '89'} რევიუ)</Text>
          </View>
        </View>
        
        <View style={styles.reviewsList}>
          {[
            { name: 'გიორგი ბერიძე', rating: 5, comment: 'ძალიან კარგი სერვისი, სწრაფი და ხარისხიანი!', date: '2 დღის წინ' },
            { name: 'მარიამ კვარაცხელია', rating: 4, comment: 'კარგია, მაგრამ ცოტა ძვირი. რეკომენდაცია ღირს.', date: '1 კვირის წინ' },
            { name: 'ნიკოლოზ კაპანაძე', rating: 5, comment: 'უმაღლესი ხარისხი! ყოველთვის აქ მოვდივარ.', date: '2 კვირის წინ' }
          ].map((review, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{review.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewerName}>{review.name}</Text>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons 
                          key={star} 
                          name={star <= review.rating ? "star" : "star-outline"} 
                          size={14} 
                          color="#F59E0B" 
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {renderHeader()}
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.infoCardContainer}>
          {renderInfoCard()}
        </View>
        {renderTabs()}
        
        {activeTab === 'details' && renderDetailsContent()}
        {activeTab === 'services' && renderServicesContent()}
        {activeTab === 'reviews' && renderReviewsContent()}
      </Animated.ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>საწყისი ფასი</Text>
          <Text style={styles.priceValue}>{params.price || '15₾'}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#6366F1" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => {
              const locationObject = {
                id: params.id || '1',
                name: title,
                address: params.address || 'თბილისი',
                rating: parseFloat(params.rating as string) || 4.9,
                reviews: parseInt(params.reviews as string) || 89,
                distance: params.distance || '1.2 კმ',
                price: params.price || '15₾',
                image: params.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
                category: params.category || 'Premium',
                isOpen: params.isOpen === 'true',
                waitTime: params.waitTime || '10 წთ',
                features: params.features ? JSON.parse(params.features as string) : [],
                services: params.services ? JSON.parse(params.services as string) : [],
                detailedServices: params.detailedServices ? JSON.parse(params.detailedServices as string) : [],
                latitude: parseFloat(params.lat as string) || 41.7151,
                longitude: parseFloat(params.lng as string) || 44.8271,
              };

              const bookingParams = {
                location: JSON.stringify(locationObject),
                locationName: title,
                locationAddress: params.address || 'თბილისი',
                locationRating: params.rating || '4.9',
                locationReviews: params.reviews || '89',
                locationDistance: params.distance || '1.2 კმ',
                locationPrice: params.price || '15₾',
                locationImage: params.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
                locationCategory: params.category || 'Premium',
                locationIsOpen: params.isOpen || 'true',
                locationWaitTime: params.waitTime || '10 წთ',
                locationFeatures: params.features || '[]',
                locationServices: params.services || '[]',
                locationDetailedServices: params.detailedServices || '[]',
              };
              
              router.push({
                pathname: '/booking',
                params: bookingParams
              });
            }}
          >
            <Text style={styles.bookButtonText}>დაჯავშნა</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 1000,
  },
  headerBackground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
    color: '#111827',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  reviewsText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: height * 0.35,
    paddingBottom: 100,
  },
  infoCardContainer: {
    paddingTop: 60,
  },
  infoCard: {
    paddingTop: 20,
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 24,
    color: '#111827',
    marginBottom: 16,
    lineHeight: 32,
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickInfoItem: {
    alignItems: 'center',
    gap: 4,
  },
  quickInfoText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#111827',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: '#111827',
  },
  directionsText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (width - 64) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  serviceName: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: '#111827',
  },
  popularBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 10,
    color: '#D97706',
  },
  serviceDuration: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  servicePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 18,
    color: '#111827',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingSummary: {
    alignItems: 'flex-end',
  },
  ratingNumber: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 24,
    color: '#111827',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 4,
  },
  totalReviews: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  reviewerName: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: '#111827',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  reviewComment: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  priceValue: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookButtonText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});