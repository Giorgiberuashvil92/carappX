import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { carBrandsApi } from '@/services/carBrandsApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const YEARS = Array.from({ length: 30 }, (_, i) => (2024 - i).toString());

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filterMake: string;
  filterModel: string;
  filterYear: string;
  onFilterChange: (filters: { 
    make: string; 
    model: string; 
    year: string;
    urgency?: string;
    status?: string;
    minBudget?: number;
    maxBudget?: number;
  }) => void;
}

export default function FilterModal({
  visible,
  onClose,
  filterMake,
  filterModel,
  filterYear,
  onFilterChange,
}: FilterModalProps) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [searchMake, setSearchMake] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    make: true,
    model: false,
    year: false,
    urgency: false,
    status: false,
    budget: false,
  });
  
  // Car brands and models from API
  const [carBrands, setCarBrands] = useState<string[]>([]);
  const [carModels, setCarModels] = useState<{ [key: string]: string[] }>({});

  const slideAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    const loadCarBrands = async () => {
      try {
        const brandsList = await carBrandsApi.getBrandsList();
        const brands = brandsList.map(b => b.name);
        const modelsMap: { [key: string]: string[] } = {};
        brandsList.forEach(brand => {
          modelsMap[brand.name] = brand.models || [];
        });
        setCarBrands(brands);
        setCarModels(modelsMap);
      } catch (err) {
        console.error('Error loading car brands:', err);
      }
    };
    loadCarBrands();
  }, []);

  // Update available models when make changes
  useEffect(() => {
    if (filterMake && carModels[filterMake]) {
      setAvailableModels(carModels[filterMake]);
      if (!expandedSections.model) {
        setExpandedSections(prev => ({ ...prev, model: true }));
      }
    } else {
      setAvailableModels([]);
      if (filterModel) {
        onFilterChange({ 
          make: filterMake, 
          model: '', 
          year: filterYear,
          urgency: filterUrgency || undefined,
          status: filterStatus || undefined,
          minBudget: minBudget ? parseFloat(minBudget) : undefined,
          maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMake, carModels]);

  const hasActiveFilters = filterMake || filterModel || filterYear || filterUrgency || filterStatus || minBudget || maxBudget;

  const activeFiltersCount = [
    filterMake,
    filterModel,
    filterYear,
    filterUrgency,
    filterStatus,
    minBudget || maxBudget,
  ].filter(Boolean).length;

  // Filtered brands and models based on search
  const filteredBrands = useMemo(() => {
    if (!searchMake.trim()) return carBrands;
    const query = searchMake.toLowerCase();
    return carBrands.filter(brand => brand.toLowerCase().includes(query));
  }, [searchMake, carBrands]);

  const filteredModels = useMemo(() => {
    if (!searchModel.trim()) return availableModels;
    const query = searchModel.toLowerCase();
    return availableModels.filter(model => model.toLowerCase().includes(query));
  }, [searchModel, availableModels]);

  const handleClearFilters = () => {
    setFilterUrgency('');
    setFilterStatus('');
    setMinBudget('');
    setMaxBudget('');
    onFilterChange({ make: '', model: '', year: '' });
  };

  const handleMakeChange = (make: string) => {
    onFilterChange({ 
      make, 
      model: '', 
      year: filterYear,
      urgency: filterUrgency,
      status: filterStatus,
      minBudget: minBudget ? parseFloat(minBudget) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
    });
  };

  const handleModelChange = (model: string) => {
    onFilterChange({ 
      make: filterMake, 
      model, 
      year: filterYear,
      urgency: filterUrgency,
      status: filterStatus,
      minBudget: minBudget ? parseFloat(minBudget) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
    });
  };

  const handleYearChange = (year: string) => {
    onFilterChange({ 
      make: filterMake, 
      model: filterModel, 
      year,
      urgency: filterUrgency,
      status: filterStatus,
      minBudget: minBudget ? parseFloat(minBudget) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
    });
  };

  const handleUrgencyChange = (urgency: string) => {
    setFilterUrgency(urgency);
    onFilterChange({ 
      make: filterMake, 
      model: filterModel, 
      year: filterYear,
      urgency,
      status: filterStatus,
      minBudget: minBudget ? parseFloat(minBudget) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
    });
  };

  const handleStatusChange = (status: string) => {
    setFilterStatus(status);
    onFilterChange({ 
      make: filterMake, 
      model: filterModel, 
      year: filterYear,
      urgency: filterUrgency,
      status,
      minBudget: minBudget ? parseFloat(minBudget) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
    });
  };

  const handleBudgetChange = () => {
    onFilterChange({ 
      make: filterMake, 
      model: filterModel, 
      year: filterYear,
      urgency: filterUrgency,
      status: filterStatus,
      minBudget: minBudget ? parseFloat(minBudget) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'სასწრაფო';
      case 'medium': return 'ნორმალური';
      case 'low': return 'დაბალი';
      default: return '';
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.8, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.modalInner}>
            {/* Header */}
            <LinearGradient
              colors={['#F8FAFC', '#FFFFFF']}
              style={styles.modalHeader}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="filter" size={20} color="#6366F1" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>ფილტრი</Text>
                    {activeFiltersCount > 0 && (
                      <Text style={styles.activeFiltersText}>
                        {activeFiltersCount} აქტიური ფილტრი
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.headerRight}>
                  {hasActiveFilters && (
                    <Pressable
                      style={styles.clearButton}
                      onPress={handleClearFilters}
                    >
                      <Ionicons name="refresh" size={16} color="#6B7280" />
                      <Text style={styles.clearButtonText}>გასუფთავება</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={onClose}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </Pressable>
                </View>
              </View>
            </LinearGradient>

            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Make Filter */}
              <View style={styles.filterSection}>
                <Pressable
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('make')}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="car-sport" size={20} color="#6366F1" />
                    <Text style={styles.sectionTitle}>მარკა</Text>
                    {filterMake && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>1</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={expandedSections.make ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>

                {expandedSections.make && (
                  <View style={styles.sectionContent}>
                    <View style={styles.searchContainer}>
                      <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="ძიება მარკებში..."
                        placeholderTextColor="#9CA3AF"
                        value={searchMake}
                        onChangeText={setSearchMake}
                      />
                      {searchMake.length > 0 && (
                        <Pressable onPress={() => setSearchMake('')}>
                          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </Pressable>
                      )}
                    </View>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.chipsScrollView}
                      contentContainerStyle={styles.chipsContainer}
                    >
                      <Pressable
                        style={[styles.filterChip, !filterMake && styles.filterChipActive]}
                        onPress={() => handleMakeChange('')}
                      >
                        <Ionicons 
                          name={!filterMake ? 'checkmark-circle' : 'ellipse-outline'} 
                          size={16} 
                          color={!filterMake ? '#FFFFFF' : '#6B7280'} 
                        />
                        <Text style={[styles.filterChipText, !filterMake && styles.filterChipTextActive]}>
                          ყველა
                        </Text>
                      </Pressable>
                      {filteredBrands.slice(0, 30).map((brand) => (
                        <Pressable
                          key={brand}
                          style={[styles.filterChip, filterMake === brand && styles.filterChipActive]}
                          onPress={() => handleMakeChange(brand)}
                        >
                          <Ionicons 
                            name={filterMake === brand ? 'checkmark-circle' : 'ellipse-outline'} 
                            size={16} 
                            color={filterMake === brand ? '#FFFFFF' : '#6B7280'} 
                          />
                          <Text style={[styles.filterChipText, filterMake === brand && styles.filterChipTextActive]}>
                            {brand}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Model Filter */}
              {filterMake && availableModels.length > 0 && (
                <View style={styles.filterSection}>
                  <Pressable
                    style={styles.sectionHeader}
                    onPress={() => toggleSection('model')}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <Ionicons name="car" size={20} color="#6366F1" />
                      <Text style={styles.sectionTitle}>მოდელი</Text>
                      {filterModel && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>1</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons
                      name={expandedSections.model ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#6B7280"
                    />
                  </Pressable>

                  {expandedSections.model && (
                    <View style={styles.sectionContent}>
                      <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="ძიება მოდელებში..."
                          placeholderTextColor="#9CA3AF"
                          value={searchModel}
                          onChangeText={setSearchModel}
                        />
                        {searchModel.length > 0 && (
                          <Pressable onPress={() => setSearchModel('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                          </Pressable>
                        )}
                      </View>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.chipsScrollView}
                        contentContainerStyle={styles.chipsContainer}
                      >
                        <Pressable
                          style={[styles.filterChip, !filterModel && styles.filterChipActive]}
                          onPress={() => handleModelChange('')}
                        >
                          <Ionicons 
                            name={!filterModel ? 'checkmark-circle' : 'ellipse-outline'} 
                            size={16} 
                            color={!filterModel ? '#FFFFFF' : '#6B7280'} 
                          />
                          <Text style={[styles.filterChipText, !filterModel && styles.filterChipTextActive]}>
                            ყველა
                          </Text>
                        </Pressable>
                        {filteredModels.slice(0, 40).map((model) => (
                          <Pressable
                            key={model}
                            style={[styles.filterChip, filterModel === model && styles.filterChipActive]}
                            onPress={() => handleModelChange(model)}
                          >
                            <Ionicons 
                              name={filterModel === model ? 'checkmark-circle' : 'ellipse-outline'} 
                              size={16} 
                              color={filterModel === model ? '#FFFFFF' : '#6B7280'} 
                            />
                            <Text style={[styles.filterChipText, filterModel === model && styles.filterChipTextActive]}>
                              {model}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Year Filter */}
              <View style={styles.filterSection}>
                <Pressable
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('year')}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="calendar" size={20} color="#6366F1" />
                    <Text style={styles.sectionTitle}>წელი</Text>
                    {filterYear && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>1</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={expandedSections.year ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>

                {expandedSections.year && (
                  <View style={styles.sectionContent}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.chipsScrollView}
                      contentContainerStyle={styles.chipsContainer}
                    >
                      <Pressable
                        style={[styles.filterChip, !filterYear && styles.filterChipActive]}
                        onPress={() => handleYearChange('')}
                      >
                        <Ionicons 
                          name={!filterYear ? 'checkmark-circle' : 'ellipse-outline'} 
                          size={16} 
                          color={!filterYear ? '#FFFFFF' : '#6B7280'} 
                        />
                        <Text style={[styles.filterChipText, !filterYear && styles.filterChipTextActive]}>
                          ყველა
                        </Text>
                      </Pressable>
                      {YEARS.map((year) => (
                        <Pressable
                          key={year}
                          style={[styles.filterChip, filterYear === year && styles.filterChipActive]}
                          onPress={() => handleYearChange(year)}
                        >
                          <Ionicons 
                            name={filterYear === year ? 'checkmark-circle' : 'ellipse-outline'} 
                            size={16} 
                            color={filterYear === year ? '#FFFFFF' : '#6B7280'} 
                          />
                          <Text style={[styles.filterChipText, filterYear === year && styles.filterChipTextActive]}>
                            {year}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Urgency Filter */}
              <View style={styles.filterSection}>
                <Pressable
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('urgency')}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="flash" size={20} color="#6366F1" />
                    <Text style={styles.sectionTitle}>სასწრაფო</Text>
                    {filterUrgency && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>1</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={expandedSections.urgency ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>

                {expandedSections.urgency && (
                  <View style={styles.sectionContent}>
                    <View style={styles.urgencyContainer}>
                      {(['low', 'medium', 'high'] as const).map((urgency) => (
                        <Pressable
                          key={urgency}
                          style={[
                            styles.urgencyOption,
                            filterUrgency === urgency && styles.urgencyOptionActive,
                          ]}
                          onPress={() => handleUrgencyChange(filterUrgency === urgency ? '' : urgency)}
                        >
                          <View
                            style={[
                              styles.urgencyDot,
                              { backgroundColor: getUrgencyColor(urgency) },
                            ]}
                          />
                          <Text style={[
                            styles.urgencyText,
                            filterUrgency === urgency && styles.urgencyTextActive,
                          ]}>
                            {getUrgencyText(urgency)}
                          </Text>
                          {filterUrgency === urgency && (
                            <Ionicons name="checkmark-circle" size={18} color={getUrgencyColor(urgency)} />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Pressable
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('status')}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="checkmark-done-circle" size={20} color="#6366F1" />
                    <Text style={styles.sectionTitle}>სტატუსი</Text>
                    {filterStatus && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>1</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={expandedSections.status ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>

                {expandedSections.status && (
                  <View style={styles.sectionContent}>
                    <View style={styles.statusContainer}>
                      {[
                        { value: 'active', label: 'აქტიური', color: '#10B981' },
                        { value: 'fulfilled', label: 'დასრულებული', color: '#6366F1' },
                        { value: 'cancelled', label: 'გაუქმებული', color: '#EF4444' },
                      ].map((status) => (
                        <Pressable
                          key={status.value}
                          style={[
                            styles.statusOption,
                            filterStatus === status.value && { borderColor: status.color },
                          ]}
                          onPress={() => handleStatusChange(filterStatus === status.value ? '' : status.value)}
                        >
                          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                          <Text style={[
                            styles.statusText,
                            filterStatus === status.value && { color: status.color, fontWeight: '600' },
                          ]}>
                            {status.label}
                          </Text>
                          {filterStatus === status.value && (
                            <Ionicons name="checkmark-circle" size={18} color={status.color} />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Budget Filter */}
              <View style={styles.filterSection}>
                <Pressable
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('budget')}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="cash" size={20} color="#6366F1" />
                    <Text style={styles.sectionTitle}>ბიუჯეტი</Text>
                    {(minBudget || maxBudget) && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>1</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={expandedSections.budget ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>

                {expandedSections.budget && (
                  <View style={styles.sectionContent}>
                    <View style={styles.budgetContainer}>
                      <View style={styles.budgetInputRow}>
                        <View style={styles.budgetInputContainer}>
                          <Text style={styles.budgetLabel}>მინიმალური</Text>
                          <View style={styles.budgetInputWrapper}>
                            <TextInput
                              style={styles.budgetInput}
                              placeholder="0"
                              placeholderTextColor="#9CA3AF"
                              value={minBudget}
                              onChangeText={setMinBudget}
                              keyboardType="numeric"
                              onBlur={handleBudgetChange}
                            />
                            <Text style={styles.budgetCurrency}>₾</Text>
                          </View>
                        </View>
                        <View style={styles.budgetSeparator}>
                          <Text style={styles.budgetSeparatorText}>—</Text>
                        </View>
                        <View style={styles.budgetInputContainer}>
                          <Text style={styles.budgetLabel}>მაქსიმალური</Text>
                          <View style={styles.budgetInputWrapper}>
                            <TextInput
                              style={styles.budgetInput}
                              placeholder="∞"
                              placeholderTextColor="#9CA3AF"
                              value={maxBudget}
                              onChangeText={setMaxBudget}
                              keyboardType="numeric"
                              onBlur={handleBudgetChange}
                            />
                            <Text style={styles.budgetCurrency}>₾</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  modalInner: {
    flex: 1,
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  activeFiltersText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  activeBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 12,
  },
  chipsScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#4F46E5',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  urgencyContainer: {
    gap: 10,
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  urgencyOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  urgencyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  urgencyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  urgencyTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  statusContainer: {
    gap: 10,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  budgetContainer: {
    gap: 12,
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  budgetInputContainer: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  budgetInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 12,
  },
  budgetCurrency: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginLeft: 8,
  },
  budgetSeparator: {
    paddingBottom: 12,
  },
  budgetSeparatorText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '300',
  },
});
