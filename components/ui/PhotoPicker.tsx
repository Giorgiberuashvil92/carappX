import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import photoService, { PhotoUploadResult } from '../../services/photoService';

export interface PhotoPickerProps {
  onPhotosSelected: (photos: { uri: string; isLocal: boolean; cloudinaryUrl?: string }[]) => void;
  maxPhotos?: number;
  folder?: string;
  initialPhotos?: { uri: string; isLocal: boolean; cloudinaryUrl?: string }[];
}

const PhotoPicker: React.FC<PhotoPickerProps> = ({
  onPhotosSelected,
  maxPhotos = 5,
  folder = 'carappx',
  initialPhotos = []
}) => {
  const [photos, setPhotos] = useState<{ uri: string; isLocal: boolean; cloudinaryUrl?: string }[]>(initialPhotos);
  const [selecting, setSelecting] = useState(false);

  const handleAddPhoto = () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('შეზღუდვა', `მაქსიმუმ ${maxPhotos} ფოტოს შეგიძლიათ ატვირთოთ`);
      return;
    }

    setSelecting(true);
    photoService.showPhotoPickerOptions(async (result) => {
      setSelecting(false);
      
      if (!result.success || !result.assets) {
        if (result.error) {
          Alert.alert('შეცდომა', result.error);
        }
        return;
      }

      const newPhotos: { uri: string; isLocal: boolean; cloudinaryUrl?: string }[] = [];

      for (let i = 0; i < result.assets.length; i++) {
        if (photos.length + newPhotos.length >= maxPhotos) {
          Alert.alert('შეზღუდვა', `მაქსიმუმ ${maxPhotos} ფოტოს შეგიძლიათ ატვირთოთ`);
          break;
        }

        const asset = result.assets[i];
        
        // Store only local URI for now - will upload on save
        newPhotos.push({
          uri: asset.uri,
          isLocal: true
        });
      }

      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);
      onPhotosSelected(updatedPhotos);
    });
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'ფოტოს წაშლა',
      'დარწმუნებული ხართ რომ გსურთ ამ ფოტოს წაშლა?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'წაშლა',
          style: 'destructive',
          onPress: () => {
            const updatedPhotos = photos.filter((_, i) => i !== index);
            setPhotos(updatedPhotos);
            onPhotosSelected(updatedPhotos);
          }
        }
      ]
    );
  };

  const renderPhotoItem = (photo: { uri: string; isLocal: boolean; cloudinaryUrl?: string }, index: number) => (
    <View key={index} style={styles.photoItem}>
      <Image source={{ uri: photo.uri }} style={styles.photoImage} />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemovePhoto(index)}
      >
        <Ionicons name="close-circle" size={24} color="#EF4444" />
      </TouchableOpacity>
      {photo.isLocal && (
        <View style={styles.localIndicator}>
          <Ionicons name="phone-portrait" size={12} color="#FFFFFF" />
        </View>
      )}
    </View>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={[styles.addButton, selecting && styles.addButtonDisabled]}
      onPress={handleAddPhoto}
      disabled={selecting || photos.length >= maxPhotos}
    >
      {selecting ? (
        <ActivityIndicator size="small" color="#6B7280" />
      ) : (
        <>
          <Ionicons name="camera" size={24} color="#6B7280" />
          <Text style={styles.addButtonText}>ფოტოს დამატება</Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ფოტოები</Text>
        <Text style={styles.subtitle}>
          {photos.length}/{maxPhotos} ფოტო
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.photosContainer}
        contentContainerStyle={styles.photosContent}
      >
        {photos.map((photo, index) => renderPhotoItem(photo, index))}
        
        {photos.length < maxPhotos && renderAddButton()}
      </ScrollView>

      {photos.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="image-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>ფოტოები არ დამატებულა</Text>
          <Text style={styles.emptySubtext}>
            კარგი ფოტოები დაეხმარება მყიდველებს
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  photosContainer: {
    maxHeight: 120,
  },
  photosContent: {
    paddingRight: 16,
    gap: 12,
  },
  photoItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderRadius: 8,
    padding: 2,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default PhotoPicker;
