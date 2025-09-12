export class Dismantler {
  id: string;
  brand: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  photos: string[];
  description: string;
  location: string;
  phone: string;
  name: string;
  contactInfo: {
    name?: string;
    email?: string;
  };
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  views: number;
  isFeatured: boolean;
}
