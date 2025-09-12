import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CarwashService {
  id: string;
  name: string;
  price: number;
  duration: number; // წუთებში
  description?: string;
}

interface ServicesConfigProps {
  services: CarwashService[];
  onServicesChange: (services: CarwashService[]) => void;
}

const DEFAULT_SERVICES: CarwashService[] = [
  { id: '1', name: 'სრული სამრეცხაო', price: 15, duration: 30, description: 'გარე და შიდა სრული გაწმენდა' },
  { id: '2', name: 'პრემიუმ სამრეცხაო', price: 25, duration: 45, description: 'სრული გაწმენდა + ცვილის გამოყენება' },
  { id: '3', name: 'სწრაფი სამრეცხაო', price: 8, duration: 15, description: 'მხოლოდ გარე გაწმენდა' },
  { id: '4', name: 'დეტალური სამრეცხაო', price: 35, duration: 60, description: 'სრული დეტალური გაწმენდა' },
];

export default function ServicesConfig({ services, onServicesChange }: ServicesConfigProps) {
  const [editingService, setEditingService] = useState<CarwashService | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddService = () => {
    const newService: CarwashService = {
      id: `service_${Date.now()}`,
      name: '',
      price: 0,
      duration: 30,
      description: '',
    };
    setEditingService(newService);
    setShowAddForm(true);
  };

  const handleEditService = (service: CarwashService) => {
    setEditingService(service);
    setShowAddForm(true);
  };

  const handleSaveService = () => {
    if (!editingService) return;

    if (!editingService.name.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ სერვისის სახელი');
      return;
    }

    if (editingService.price <= 0) {
      Alert.alert('შეცდომა', 'ფასი უნდა იყოს 0-ზე მეტი');
      return;
    }

    if (editingService.duration <= 0) {
      Alert.alert('შეცდომა', 'ხანგრძლივობა უნდა იყოს 0-ზე მეტი');
      return;
    }

    const isNewService = !services.find(s => s.id === editingService.id);
    
    if (isNewService) {
      onServicesChange([...services, editingService]);
    } else {
      onServicesChange(services.map(s => s.id === editingService.id ? editingService : s));
    }

    setEditingService(null);
    setShowAddForm(false);
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      'სერვისის წაშლა',
      'ნამდვილად გსურთ ამ სერვისის წაშლა?',
      [
        { text: 'არა', style: 'cancel' },
        { 
          text: 'კი', 
          style: 'destructive',
          onPress: () => {
            onServicesChange(services.filter(s => s.id !== serviceId));
          }
        }
      ]
    );
  };

  const handleUseDefaults = () => {
    Alert.alert(
      'ნაგულისხმები სერვისები',
      'ნამდვილად გსურთ ნაგულისხმები სერვისების გამოყენება? ეს ჩაანაცვლებს არსებულ სერვისებს.',
      [
        { text: 'არა', style: 'cancel' },
        { 
          text: 'კი', 
          onPress: () => {
            onServicesChange(DEFAULT_SERVICES);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>სერვისების კონფიგურაცია</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.defaultButton} onPress={handleUseDefaults}>
            <Ionicons name="refresh" size={16} color="#6B7280" />
            <Text style={styles.defaultButtonText}>ნაგულისხმები</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddService}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>დამატება</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.servicesList} showsVerticalScrollIndicator={false}>
        {services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <View style={styles.serviceDetails}>
                <Text style={styles.servicePrice}>{service.price}₾</Text>
                <Text style={styles.serviceDuration}>{service.duration} წთ</Text>
              </View>
              {service.description && (
                <Text style={styles.serviceDescription}>{service.description}</Text>
              )}
            </View>
            <View style={styles.serviceActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditService(service)}
              >
                <Ionicons name="pencil" size={16} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteService(service.id)}
              >
                <Ionicons name="trash" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {services.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>სერვისები არ არის</Text>
            <Text style={styles.emptyStateText}>დაამატეთ სერვისები ან გამოიყენეთ ნაგულისხმები</Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Service Modal */}
      {showAddForm && editingService && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {services.find(s => s.id === editingService.id) ? 'სერვისის რედაქტირება' : 'ახალი სერვისი'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>სერვისის სახელი *</Text>
                <TextInput
                  style={styles.input}
                  value={editingService.name}
                  onChangeText={(text) => setEditingService({ ...editingService, name: text })}
                  placeholder="მაგ. სრული სამრეცხაო"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ფასი (₾) *</Text>
                  <TextInput
                    style={styles.input}
                    value={editingService.price.toString()}
                    onChangeText={(text) => setEditingService({ ...editingService, price: parseFloat(text) || 0 })}
                    placeholder="15"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ხანგრძლივობა (წთ) *</Text>
                  <TextInput
                    style={styles.input}
                    value={editingService.duration.toString()}
                    onChangeText={(text) => setEditingService({ ...editingService, duration: parseInt(text) || 0 })}
                    placeholder="30"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>აღწერა</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editingService.description || ''}
                  onChangeText={(text) => setEditingService({ ...editingService, description: text })}
                  placeholder="სერვისის დეტალური აღწერა..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>გაუქმება</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveService}
              >
                <Text style={styles.saveButtonText}>შენახვა</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  defaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 4,
  },
  defaultButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
  servicesList: {
    flex: 1,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#3B82F6',
  },
  serviceDuration: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
  },
  serviceDescription: {
    fontSize: 12,
    fontFamily: 'NotoSans_500Medium',
    color: '#6B7280',
    lineHeight: 16,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'NotoSans_500Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'NotoSans_700Bold',
    color: '#111827',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'NotoSans_600SemiBold',
    color: '#FFFFFF',
  },
});
