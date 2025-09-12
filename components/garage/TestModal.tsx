import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

// ტესტ მანქანების მონაცემები
const TEST_CARS: CarData[] = [
  {
    id: '1',
    brand: 'BMW',
    model: 'M5 Competition',
    year: '2023',
    licensePlate: 'AA-001-AA',
    color: 'შავი',
    vin: 'WBS8M9C50P5K123456',
    fuelType: 'ბენზინი',
    transmission: 'ავტომატური',
  },
  {
    id: '2',
    brand: 'Mercedes-Benz',
    model: 'C63 S AMG',
    year: '2024',
    licensePlate: 'BB-002-BB',
    color: 'თეთრი',
    vin: 'WDDWF4JB0FR123456',
    fuelType: 'ბენზინი',
    transmission: 'ავტომატური',
  },
  {
    id: '3',
    brand: 'Audi',
    model: 'RS6 Avant',
    year: '2023',
    licensePlate: 'CC-003-CC',
    color: 'ლურჯი',
    vin: 'WAUZZZ4F8KN123456',
    fuelType: 'ბენზინი',
    transmission: 'ავტომატური',
  },
];

export default function TestModal() {
  const [cars, setCars] = useState<CarData[]>(TEST_CARS);
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
    carsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    carCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      padding: 16,
      width: '48%',
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
    carIcon: {
      width: 32,
      height: 32,
      backgroundColor: '#F8F9FA',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E9ECEF',
    },
    carTitle: {
      fontFamily: 'NotoSans_700Bold',
      fontSize: 14,
      color: '#212529',
      marginBottom: 4,
    },
    carModel: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      color: '#6C757D',
      marginBottom: 8,
    },
    carPlate: {
      fontFamily: 'NotoSans_600SemiBold',
      fontSize: 11,
      color: '#3B82F6',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
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
        <View style={styles.content}>
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
            <View style={styles.carsGrid}>
              {cars.map((car) => (
                <View key={car.id} style={styles.carCard}>
                  <View style={styles.carHeader}>
                    <View style={styles.carIcon}>
                      <Ionicons name="car" size={16} color="#3B82F6" />
                    </View>
                  </View>
                  <Text style={styles.carTitle}>{car.brand}</Text>
                  <Text style={styles.carModel}>{car.model}</Text>
                  <Text style={styles.carPlate}>{car.licensePlate}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Add Car Modal */}
        <AddCarModal
          visible={showAddCarModal}
          onClose={() => setShowAddCarModal(false)}
          onAddCar={handleAddCar}
          existingCars={cars}
        />
      </View>
    </SafeAreaView>
  );
}
