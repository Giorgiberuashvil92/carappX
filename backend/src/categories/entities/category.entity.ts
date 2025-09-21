export interface Category {
  id: string;
  name: string;
  nameEn: string; // English name for API compatibility
  description: string;
  icon: string; // Icon name or URL
  color: string; // Hex color code
  image: string; // Background image URL
  isActive: boolean;
  order: number; // Display order
  parentId?: string; // For subcategories
  serviceTypes: string[]; // Related service types
  popularity: number; // Calculated popularity score
  viewCount: number; // How many times viewed
  clickCount: number; // How many times clicked
  createdAt: number;
  updatedAt: number;
}

export interface CategoryStats {
  totalServices: number;
  averageRating: number;
  totalBookings: number;
  lastUpdated: number;
}
