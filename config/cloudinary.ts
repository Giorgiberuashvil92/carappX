interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  apiSecret?: string;
}

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dtj9xx4qu',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'carxapp',
  apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '774761955986971',
  apiSecret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || 'izwnEo_BBMPabtO2yB5Ktvota9c',
};

export const CLOUDINARY_BASE_URL = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}`;
export const CLOUDINARY_UPLOAD_URL = `${CLOUDINARY_BASE_URL}/image/upload`;
