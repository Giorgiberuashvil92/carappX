export class Part {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: 'ახალი' | 'ძალიან კარგი' | 'კარგი' | 'დამაკმაყოფილებელი';
  price: string;
  images: string[];
  seller: string;
  location: string;
  phone: string;
  name: string;
  contactInfo: {
    name?: string;
    email?: string;
  };
  // Car details - now required
  brand: string;
  model: string;
  year: number;
  // Additional fields
  partNumber: string; // Changed to required (empty string if not provided)
  warranty: string; // Changed to required (empty string if not provided)
  isNegotiable: boolean;
  status: 'active' | 'inactive' | 'sold' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  views: number;
  isFeatured: boolean;
}
