import {
  CarwashService,
  TimeSlotsConfig,
  RealTimeStatus,
} from '../entities/carwash-location.entity';

export class CreateCarwashLocationDto {
  name: string;
  phone: string;
  category: string;
  location: string;
  address: string;
  price: number;
  rating: number;
  reviews: number;
  services: string; // ძველი ველი - backward compatibility
  detailedServices?: CarwashService[]; // ახალი დეტალური სერვისები
  features?: string;
  workingHours: string; // ძველი ველი - backward compatibility
  timeSlotsConfig?: TimeSlotsConfig; // ახალი დროის სლოტების კონფიგურაცია
  images?: string[];
  description: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean; // ძველი ველი - backward compatibility
  realTimeStatus?: RealTimeStatus; // რეალური დროის სტატუსი
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}
