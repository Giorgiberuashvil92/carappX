import { cloudinaryConfig, CLOUDINARY_UPLOAD_URL } from '../config/cloudinary';

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * ავტვირთავს ფოტოს cloudinary-ზე
 * @param imageUri - ლოკალური ფოტოს URI
 * @param folder - cloudinary-ში ფოლდერის სახელი (არასავალდებულო)
 * @returns Promise<CloudinaryUploadResult>
 */
export const uploadToCloudinary = async (
  imageUri: string,
  folder?: string
): Promise<CloudinaryUploadResult> => {
  try {
    // ფოტოს მონაცემების მიღება
    const formData = new FormData();
    
    // ფოტოს ფაილის შექმნა
    const imageFile = {
      uri: imageUri,
      type: 'image/jpeg',
      name: `car_${Date.now()}.jpg`,
    } as any;

    formData.append('file', imageFile);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    
    // ფოლდერის დამატება თუ მითითებულია
    if (folder) {
      formData.append('folder', folder);
    }

    // cloudinary-ზე ავტვირთვა
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.secure_url) {
      return {
        success: true,
        url: result.secure_url,
      };
    } else {
      throw new Error('No secure_url in response');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * ავტვირთავს მანქანის ფოტოს cloudinary-ზე cars ფოლდერში
 * @param imageUri - ლოკალური ფოტოს URI
 * @returns Promise<CloudinaryUploadResult>
 */
export const uploadCarImage = async (imageUri: string): Promise<CloudinaryUploadResult> => {
  return uploadToCloudinary(imageUri, 'cars');
};

/**
 * ავტვირთავს პროფილის ფოტოს cloudinary-ზე profiles ფოლდერში
 * @param imageUri - ლოკალური ფოტოს URI
 * @returns Promise<CloudinaryUploadResult>
 */
export const uploadProfileImage = async (imageUri: string): Promise<CloudinaryUploadResult> => {
  return uploadToCloudinary(imageUri, 'profiles');
};

/**
 * ავტვირთავს ზოგად ფოტოს cloudinary-ზე general ფოლდერში
 * @param imageUri - ლოკალური ფოტოს URI
 * @returns Promise<CloudinaryUploadResult>
 */
export const uploadGeneralImage = async (imageUri: string): Promise<CloudinaryUploadResult> => {
  return uploadToCloudinary(imageUri, 'general');
};
