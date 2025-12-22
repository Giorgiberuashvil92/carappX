import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CarRentalCardProps {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  image: string;
  transmission: string;
  fuelType: string;
  seats: number;
  rating: number;
  reviews: number;
  location: string;
  available: boolean;
  features?: string[];
  phone?: string;
  onPress: () => void;
  onCall?: (phone: string) => void;
  width?: number;
  height?: number;
}

export default function CarRentalCard({
  brand,
  model,
  year,
  category,
  pricePerDay,
  pricePerWeek,
  image,
  transmission,
  fuelType,
  seats,
  rating,
  reviews,
  location,
  available,
  features = [],
  phone,
  onPress,
  onCall,
  width = 280,
  height = 200,
}: CarRentalCardProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={[styles.card, { width, height }]} 
      onPress={onPress}
    >
      <ImageBackground 
        source={{ uri: image }} 
        style={styles.image} 
        imageStyle={styles.imageRounded}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.55)"]}
          style={styles.overlay}
        />
        
        {/* Top Row */}
        <View style={styles.topRow}>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color="#111827" />
            <Text style={styles.ratingPillText}>{rating.toFixed(1)}</Text>
          </View>
          
          {/* Availability Badge */}
          <View style={[styles.availabilityBadge, !available && styles.unavailableBadge]}>
            <Ionicons
              name={available ? 'checkmark-circle' : 'close-circle'}
              size={12}
              color="#fff"
            />
            <Text style={styles.availabilityText}>
              {available ? 'თავისუფალია' : 'დაკავებული'}
            </Text>
          </View>
        </View>

        {/* Bottom Area */}
        <View style={styles.bottomArea}>
          <Text numberOfLines={1} style={styles.title}>
            {brand} {model}
          </Text>
          
          {/* Category & Year */}
          <View style={styles.categoryRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
            <View style={styles.yearPill}>
              <Text style={styles.yearText}>{year}</Text>
            </View>
          </View>
          
          {/* Meta Row */}
          <View style={styles.metaRow}>
            {/* Specs Pills */}
            <View style={styles.specsWrap}>
              <View style={styles.specPill}>
                <Ionicons name="settings-outline" size={10} color="#FFFFFF" />
                <Text style={styles.specText}>{transmission === 'ავტომატიკა' ? 'Auto' : 'Manual'}</Text>
              </View>
              <View style={styles.specPill}>
                <Ionicons name="people-outline" size={10} color="#FFFFFF" />
                <Text style={styles.specText}>{seats}</Text>
              </View>
            </View>
            
            {/* Price */}
            <View style={styles.priceWrap}>
              <Text style={styles.priceText}>{pricePerDay}₾</Text>
              <Text style={styles.priceSuffix}>/დღე</Text>
            </View>
          </View>
          
          {/* Bottom Row - Location & Call */}
          <View style={styles.bottomRow}>
            {location && (
              <View style={styles.locationPill}>
                <Feather name="map-pin" size={10} color="#FFFFFF" />
                <Text style={styles.locationText}>{location}</Text>
              </View>
            )}
            
            {phone && onCall && (
              <TouchableOpacity 
                style={styles.callButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onCall(phone);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={12} color="#FFFFFF" />
                <Text style={styles.callButtonText}>დარეკვა</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  image: { 
    width: '100%', 
    height: '100%' 
  },
  imageRounded: { 
    borderRadius: 28 
  },
  overlay: { 
    ...StyleSheet.absoluteFillObject 
  },
  topRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 14 
  },
  ratingPillText: { 
    color: '#111827', 
    fontFamily: 'Inter', 
    fontSize: 12 
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  unavailableBadge: {
    backgroundColor: '#EF4444',
  },
  availabilityText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter',
  },
  bottomArea: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 18,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yearPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  yearText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 10,
  },
  metaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  specsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specText: { 
    color: '#FFFFFF', 
    fontFamily: 'Inter', 
    fontSize: 10 
  },
  priceWrap: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    gap: 4, 
    backgroundColor: 'rgba(0,0,0,0.45)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 18 
  },
  priceText: { 
    color: '#FFFFFF', 
    fontFamily: 'Inter', 
    fontSize: 15 
  },
  priceSuffix: { 
    color: '#E5E7EB', 
    fontFamily: 'Inter', 
    fontSize: 9, 
    marginBottom: 2 
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: { 
    color: '#FFFFFF', 
    fontFamily: 'Inter', 
    fontSize: 10 
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
  },
});

