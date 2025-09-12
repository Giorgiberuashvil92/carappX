import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { cloudinaryConfig, CLOUDINARY_UPLOAD_URL } from '../config/cloudinary';

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export interface PhotoPickerResult {
  success: boolean;
  assets?: ImagePicker.ImagePickerAsset[];
  error?: string;
}

class PhotoService {
  
  /**
   * Request camera and media library permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'ნებართვა საჭიროა',
          'ფოტოების გამოსაყენებლად საჭიროა კამერისა და გალერეის ნებართვა'
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Show photo picker options (camera or gallery)
   */
  showPhotoPickerOptions(onComplete: (result: PhotoPickerResult) => void) {
    Alert.alert(
      'ფოტოს არჩევა',
      'აირჩიეთ ფოტოს წყარო',
      [
        {
          text: 'გაუქმება',
          style: 'cancel',
          onPress: () => onComplete({ success: false, error: 'გაუქმებულია' })
        },
        {
          text: 'კამერა',
          onPress: () => this.openCamera(onComplete)
        },
        {
          text: 'გალერეა',
          onPress: () => this.openGallery(onComplete)
        }
      ]
    );
  }

  /**
   * Open camera to take photo
   */
  async openCamera(onComplete: (result: PhotoPickerResult) => void) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        onComplete({ success: false, error: 'ნებართვა არ არის მიღებული' });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onComplete({ success: true, assets: result.assets });
      } else {
        onComplete({ success: false, error: 'ფოტო არ აირჩა' });
      }
    } catch (error) {
      console.error('Camera error:', error);
      onComplete({ success: false, error: 'კამერის გახსნისას მოხდა შეცდომა' });
    }
  }

  /**
   * Open gallery to select photos
   */
  async openGallery(onComplete: (result: PhotoPickerResult) => void, allowMultiple: boolean = true) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        onComplete({ success: false, error: 'ნებართვა არ არის მიღებული' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !allowMultiple,
        allowsMultipleSelection: allowMultiple,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
        selectionLimit: allowMultiple ? 5 : 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onComplete({ success: true, assets: result.assets });
      } else {
        onComplete({ success: false, error: 'ფოტო არ აირჩა' });
      }
    } catch (error) {
      console.error('Gallery error:', error);
      onComplete({ success: false, error: 'გალერეის გახსნისას მოხდა შეცდომა' });
    }
  }

  /**
   * Upload photo to Cloudinary
   */
  async uploadPhoto(imageUri: string, folder?: string): Promise<PhotoUploadResult> {
    try {
      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
        return {
          success: false,
          error: 'Cloudinary configuration არ არის დაყენებული'
        };
      }

      // Create form data
      const formData = new FormData();
      
      // Add the image file
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `upload_${Date.now()}.jpg`,
      } as any);
      
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      
      if (folder) {
        formData.append('folder', folder);
      }
      
      // Add tags for better organization
      formData.append('tags', 'carappx,mobile,user_upload');

      console.log('Uploading to Cloudinary...');

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (response.ok && result.secure_url) {
        console.log('Upload successful:', result.secure_url);
        return {
          success: true,
          url: result.secure_url,
          publicId: result.public_id,
        };
      } else {
        console.error('Upload failed:', result);
        return {
          success: false,
          error: result.error?.message || 'ფოტოს ატვირთვა ვერ მოხერხდა'
        };
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      return {
        success: false,
        error: 'ფოტოს ატვირთვისას მოხდა შეცდომა'
      };
    }
  }

  /**
   * Upload multiple photos
   */
  async uploadMultiplePhotos(imageUris: string[], folder?: string): Promise<PhotoUploadResult[]> {
    const results: PhotoUploadResult[] = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      const result = await this.uploadPhoto(imageUris[i], folder);
      results.push(result);
      
      // Small delay between uploads to avoid rate limiting
      if (i < imageUris.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }

  /**
   * Process photos for saving - upload local photos to Cloudinary
   */
  async processPhotosForSaving(
    photos: { uri: string; isLocal: boolean; cloudinaryUrl?: string }[],
    folder?: string
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      if (photo.isLocal) {
        // Upload local photo
        const result = await this.uploadPhoto(photo.uri, folder);
        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        }
      } else if (photo.cloudinaryUrl) {
        // Already uploaded photo
        uploadedUrls.push(photo.cloudinaryUrl);
      }
    }
    
    return uploadedUrls;
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  }): string {
    const { width = 400, height = 300, quality = 80, format = 'auto' } = options || {};
    
    return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(publicId: string): string {
    return this.getOptimizedUrl(publicId, {
      width: 150,
      height: 150,
      quality: 70
    });
  }
}

export const photoService = new PhotoService();
export default photoService;
