export class Store {
  id: string;
  title: string;
  description: string;
  type: 'ავტონაწილები' | 'სამართ-დასახურებელი' | 'რემონტი' | 'სხვა';
  images: string[];
  location: string;
  address: string;
  phone: string;
  name: string;
  email?: string;
  website?: string;
  workingHours: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  services: string[];
  specializations: string[];
  contactInfo: {
    ownerName?: string;
    managerName?: string;
    alternativePhone?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  businessInfo: {
    yearEstablished?: number;
    employeeCount?: number;
    license?: string;
  };
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  rating?: number;
  reviewCount?: number;
}
