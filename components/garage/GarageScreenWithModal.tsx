import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddCarModal from './AddCarModal';

interface CarData {
  id: string;
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  color: string;
  vin: string;
  fuelType: string;
  transmission: string;
}

export default function GarageScreenWithModal() {
  const [cars, setCars] = useState<CarData[]>([]);
  const [showAddCarModal, setShowAddCarModal] = useState(false);

  const handleAddCar = (carData: CarData) => {
    setCars(prev => [...prev, carData]);
    console.log('დამატებული მანქანა:', carData);
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F8F9FA',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    headerTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 20,
      color: '#1A1A1A',
      letterSpacing: -0.5,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#3B82F6',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyStateIcon: {
      width: 80,
      height: 80,
      backgroundColor: '#F8F9FA',
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 18,
      color: '#495057',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateText: {
      fontFamily: 'NotoSans_400Regular',
      fontSize: 14,
      color: '#6C757D',
      textAlign: 'center',
      lineHeight: 20,
    },
    carCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      marginBottom: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    carHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    carTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 16,
      color: '#212529',
    },
    carPlate: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 14,
      color: '#3B82F6',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    carDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    carDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    carDetailText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      color: '#6C757D',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>ჩემი მანქანები</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddCarModal(true)}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {cars.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="car-outline" size={40} color="#6C757D" />
              </View>
              <Text style={styles.emptyStateTitle}>მანქანები არ არის დამატებული</Text>
              <Text style={styles.emptyStateText}>
                დაამატეთ თქვენი პირველი მანქანა ზემოთ მოცემული ღილაკის გამოყენებით
              </Text>
            </View>
          ) : (
            cars.map((car) => (
              <View key={car.id} style={styles.carCard}>
                <View style={styles.carHeader}>
                  <Text style={styles.carTitle}>
                    {car.brand} {car.model}
                  </Text>
                  <Text style={styles.carPlate}>{car.licensePlate}</Text>
                </View>
                <View style={styles.carDetails}>
                  {car.year && (
                    <View style={styles.carDetail}>
                      <Ionicons name="calendar-outline" size={12} color="#6C757D" />
                      <Text style={styles.carDetailText}>{car.year}</Text>
                    </View>
                  )}
                  {car.color && (
                    <View style={styles.carDetail}>
                      <Ionicons name="color-palette-outline" size={12} color="#6C757D" />
                      <Text style={styles.carDetailText}>{car.color}</Text>
                    </View>
                  )}
                  {car.fuelType && (
                    <View style={styles.carDetail}>
                      <Ionicons name="water-outline" size={12} color="#6C757D" />
                      <Text style={styles.carDetailText}>{car.fuelType}</Text>
                    </View>
                  )}
                  {car.transmission && (
                    <View style={styles.carDetail}>
                      <Ionicons name="settings-outline" size={12} color="#6C757D" />
                      <Text style={styles.carDetailText}>{car.transmission}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Car Modal */}
        <AddCarModal
          visible={showAddCarModal}
          onClose={() => setShowAddCarModal(false)}
          onAddCar={handleAddCar}
        />
      </View>
    </SafeAreaView>
  );
}
