import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export type RecommendationItem = {
  providerName: string;
  priceGEL: number;
  etaMin?: number;
  distanceKm?: number;
  tags?: string[];
  partnerId?: string;
  imageUrl?: string;
  rating?: number;
  verified?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  items: RecommendationItem[];
  loading: boolean;
  error?: string;
  onSortByPrice: () => void;
  onSortByDistance: () => void;
  onVisit: () => void;
};

export function OffersModal({ visible, onClose, items, loading, error, onSortByPrice, onSortByDistance, onVisit }: Props) {
  const [tab, setTab] = useState<'best' | 'price' | 'near'>('best');

  const sortedItems = useMemo(() => {
    if (!items) return [] as RecommendationItem[];
    if (tab === 'price') return [...items].sort((a, b) => (a.priceGEL || 0) - (b.priceGEL || 0));
    if (tab === 'near') return [...items].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    return [...items].sort((a, b) => {
      const aScore = (a.distanceKm ?? 5) * 0.4 + (a.priceGEL ?? 100) * 0.6;
      const bScore = (b.distanceKm ?? 5) * 0.4 + (b.priceGEL ?? 100) * 0.6;
      return aScore - bScore;
    });
  }, [items, tab]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        
        {/* Modern Modal Card */}
        <View style={styles.modalCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerStrip} />
              <View style={styles.headerContent}>
                <Text style={styles.title}>შეთავაზებები</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
              {[
                { id: 'best', label: 'საუკეთესო', icon: 'star' },
                { id: 'price', label: 'ფასი', icon: 'pricetag' },
                { id: 'near', label: 'მანძილი', icon: 'location' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => {
                    setTab(filter.id as any);
                    if (filter.id === 'price') onSortByPrice();
                    if (filter.id === 'near') onSortByDistance();
                  }}
                  style={[styles.filterTab, tab === filter.id && styles.filterTabActive]}
                >
                  <Ionicons 
                    name={filter.icon as any} 
                    size={16} 
                    color={tab === filter.id ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[styles.filterTabText, tab === filter.id && styles.filterTabTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Content */}
            <View style={styles.content}>
              {loading && (
                <View style={styles.loadingState}>
                  <View style={styles.loadingIcon}>
                    <Ionicons name="refresh" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.loadingText}>იტვირთება...</Text>
                </View>
              )}

              {error && !loading && (
                <View style={styles.errorState}>
                  <View style={styles.errorIcon}>
                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                  </View>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {!loading && !error && sortedItems?.length > 0 && (
                <ScrollView showsVerticalScrollIndicator={false} style={styles.offersList}>
                  {sortedItems.map((offer, index) => (
                    <View key={index} style={styles.offerCard}>
                      {/* Provider Info */}
                      <View style={styles.providerSection}>
                        <View style={styles.providerAvatar}>
                          {offer.imageUrl ? (
                            <Image source={{ uri: offer.imageUrl }} style={styles.providerImage} />
                          ) : (
                            <Text style={styles.providerInitial}>
                              {offer.providerName?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                          )}
                        </View>
                        <View style={styles.providerInfo}>
                          <Text style={styles.providerName}>{offer.providerName}</Text>
                          <View style={styles.ratingSection}>
                            {offer.rating && (
                              <View style={styles.rating}>
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text style={styles.ratingText}>{offer.rating}</Text>
                              </View>
                            )}
                            {offer.verified && (
                              <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                                <Text style={styles.verifiedText}>დადასტურებული</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.priceSection}>
                          <Text style={styles.price}>{offer.priceGEL}₾</Text>
                        </View>
                      </View>

                      {/* Meta Info */}
                      <View style={styles.metaSection}>
                        <View style={styles.metaItems}>
                          {offer.distanceKm && (
                            <View style={styles.metaItem}>
                              <Ionicons name="location" size={12} color="#6B7280" />
                              <Text style={styles.metaText}>{offer.distanceKm.toFixed(1)} კმ</Text>
                            </View>
                          )}
                          {offer.etaMin && (
                            <View style={styles.metaItem}>
                              <Ionicons name="time" size={12} color="#6B7280" />
                              <Text style={styles.metaText}>{offer.etaMin} წთ</Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity style={styles.visitButton} onPress={onVisit}>
                          <Text style={styles.visitButtonText}>ვიზიტი</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              {!loading && !error && (!sortedItems || sortedItems.length === 0) && (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                  </View>
                  <Text style={styles.emptyTitle}>შეთავაზებები ვერ მოიძებნა</Text>
                  <Text style={styles.emptySubtitle}>სცადეთ სხვა ფილტრები</Text>
                </View>
              )}
            </View>

            {/* Footer */}
            {!loading && !error && sortedItems && sortedItems.length > 0 && (
              <View style={styles.footer}>
                <TouchableOpacity style={styles.footerButton} onPress={onVisit}>
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    style={styles.footerButtonGradient}
                  >
                    <Ionicons name="storefront" size={18} color="#FFFFFF" />
                    <Text style={styles.footerButtonText}>ყველა შეთავაზება Marketplace-ში</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalGradient: {
    flex: 1,
  },
  
  // Header
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerStrip: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Loading & Error States
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    fontFamily: 'Inter',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  
  // Offers List
  offersList: {
    flex: 1,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  
  // Provider Section
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  providerInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#10B981',
    fontFamily: 'Inter',
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
    fontFamily: 'Inter',
  },
  
  // Meta Section
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItems: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  visitButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  visitButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: 'Inter',
  },
  
  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  footerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});

export default OffersModal;