import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

export interface CarWashLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  priceRange: string;
  services: string[];
  workingHours: {
    weekdays: string;
    weekends: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  images: string[];
  amenities: string[];
  isOpen: boolean;
}

export interface CarWashService {
  id: string;
  locationId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  category: string;
  isAvailable: boolean;
}

@Injectable()
export class CarWashSeedData {
  constructor(private firebaseService: FirebaseService) {}

  async seedCarWashLocations(): Promise<void> {
    const locations: CarWashLocation[] = [
      {
        id: 'location_1',
        name: 'CAR WASH CENTER',
        address: 'რუსთაველის გამზირი 15, თბილისი',
        phone: '+995 32 123 4567',
        rating: 4.8,
        priceRange: '15-50₾',
        services: ['სრული სამრეცხაო', 'პრემიუმ სამრეცხაო', 'ძრავის წმენდა'],
        workingHours: {
          weekdays: '08:00 - 22:00',
          weekends: '09:00 - 21:00',
        },
        coordinates: {
          lat: 41.7151,
          lng: 44.8271,
        },
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        ],
        amenities: ['WiFi', 'კაფე', 'პარკინგი', '24/7'],
        isOpen: true,
      },
      {
        id: 'location_2',
        name: 'ALL CLEAN',
        address: 'აღმაშენებლის გამზირი 45, თბილისი',
        phone: '+995 32 234 5678',
        rating: 4.6,
        priceRange: '20-60₾',
        services: ['პრემიუმ სამრეცხაო', 'ძრავის წმენდა', 'ვაქსირება'],
        workingHours: {
          weekdays: '07:00 - 23:00',
          weekends: '08:00 - 22:00',
        },
        coordinates: {
          lat: 41.7225,
          lng: 44.7925,
        },
        images: [
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        ],
        amenities: ['WiFi', 'კაფე', 'პარკინგი', 'VIP ოთახი'],
        isOpen: true,
      },
      {
        id: 'location_3',
        name: 'LUCKY WASH',
        address: 'ვაზისუბნის ქუჩა 12, თბილისი',
        phone: '+995 32 345 6789',
        rating: 4.9,
        priceRange: '25-80₾',
        services: ['ძრავის წმენდა', 'სრული სამრეცხაო', 'პრემიუმ სამრეცხაო'],
        workingHours: {
          weekdays: '06:00 - 24:00',
          weekends: '07:00 - 23:00',
        },
        coordinates: {
          lat: 41.6934,
          lng: 44.8015,
        },
        images: [
          'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        ],
        amenities: ['WiFi', 'კაფე', 'პარკინგი', '24/7', 'VIP ოთახი', 'მასაჟი'],
        isOpen: true,
      },
      {
        id: 'location_4',
        name: 'SPARKLE CLEAN',
        address: 'პეკინის ქუჩა 8, თბილისი',
        phone: '+995 32 456 7890',
        rating: 4.7,
        priceRange: '18-45₾',
        services: ['სრული სამრეცხაო', 'ძრავის წმენდა', 'ვაქსირება'],
        workingHours: {
          weekdays: '08:00 - 21:00',
          weekends: '09:00 - 20:00',
        },
        coordinates: {
          lat: 41.7064,
          lng: 44.7831,
        },
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        ],
        amenities: ['WiFi', 'პარკინგი', '24/7'],
        isOpen: true,
      },
      {
        id: 'location_5',
        name: 'PREMIUM WASH',
        address: 'წერეთლის გამზირი 25, თბილისი',
        phone: '+995 32 567 8901',
        rating: 4.5,
        priceRange: '30-100₾',
        services: [
          'პრემიუმ სამრეცხაო',
          'ძრავის წმენდა',
          'ვაქსირება',
          'დეტეილინგი',
        ],
        workingHours: {
          weekdays: '09:00 - 22:00',
          weekends: '10:00 - 21:00',
        },
        coordinates: {
          lat: 41.7209,
          lng: 44.7847,
        },
        images: [
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        ],
        amenities: ['WiFi', 'კაფე', 'პარკინგი', 'VIP ოთახი', 'მასაჟი', 'საუნა'],
        isOpen: true,
      },
    ];

    for (const location of locations) {
      await this.firebaseService.db
        .collection('carwash_locations')
        .doc(location.id)
        .set(location);
    }

    console.log('✅ Car wash locations seeded successfully!');
  }

  async seedCarWashServices(): Promise<void> {
    const services: CarWashService[] = [
      // CAR WASH CENTER services
      {
        id: 'service_1',
        locationId: 'location_1',
        name: 'სრული სამრეცხაო',
        description: 'გარე და შიდა სრული გაწმენდა',
        price: 15,
        duration: 30,
        category: 'basic',
        isAvailable: true,
      },
      {
        id: 'service_2',
        locationId: 'location_1',
        name: 'პრემიუმ სამრეცხაო',
        description: 'სრული სამრეცხაო + ვაქსირება + დეტეილინგი',
        price: 35,
        duration: 60,
        category: 'premium',
        isAvailable: true,
      },
      {
        id: 'service_3',
        locationId: 'location_1',
        name: 'ძრავის წმენდა',
        description: 'ძრავის კომპარტმენტის სრული გაწმენდა',
        price: 25,
        duration: 45,
        category: 'engine',
        isAvailable: true,
      },

      // ALL CLEAN services
      {
        id: 'service_4',
        locationId: 'location_2',
        name: 'პრემიუმ სამრეცხაო',
        description: 'სრული სამრეცხაო + ვაქსირება',
        price: 40,
        duration: 50,
        category: 'premium',
        isAvailable: true,
      },
      {
        id: 'service_5',
        locationId: 'location_2',
        name: 'ძრავის წმენდა',
        description: 'ძრავის კომპარტმენტის გაწმენდა',
        price: 30,
        duration: 40,
        category: 'engine',
        isAvailable: true,
      },
      {
        id: 'service_6',
        locationId: 'location_2',
        name: 'ვაქსირება',
        description: 'ავტომობილის ვაქსირება',
        price: 20,
        duration: 25,
        category: 'waxing',
        isAvailable: true,
      },

      // LUCKY WASH services
      {
        id: 'service_7',
        locationId: 'location_3',
        name: 'ძრავის წმენდა',
        description: 'ძრავის კომპარტმენტის სრული გაწმენდა',
        price: 35,
        duration: 50,
        category: 'engine',
        isAvailable: true,
      },
      {
        id: 'service_8',
        locationId: 'location_3',
        name: 'სრული სამრეცხაო',
        description: 'გარე და შიდა სრული გაწმენდა',
        price: 20,
        duration: 35,
        category: 'basic',
        isAvailable: true,
      },
      {
        id: 'service_9',
        locationId: 'location_3',
        name: 'პრემიუმ სამრეცხაო',
        description: 'სრული სამრეცხაო + ვაქსირება + დეტეილინგი',
        price: 50,
        duration: 75,
        category: 'premium',
        isAvailable: true,
      },

      // SPARKLE CLEAN services
      {
        id: 'service_10',
        locationId: 'location_4',
        name: 'სრული სამრეცხაო',
        description: 'გარე და შიდა სრული გაწმენდა',
        price: 18,
        duration: 30,
        category: 'basic',
        isAvailable: true,
      },
      {
        id: 'service_11',
        locationId: 'location_4',
        name: 'ძრავის წმენდა',
        description: 'ძრავის კომპარტმენტის გაწმენდა',
        price: 28,
        duration: 40,
        category: 'engine',
        isAvailable: true,
      },
      {
        id: 'service_12',
        locationId: 'location_4',
        name: 'ვაქსირება',
        description: 'ავტომობილის ვაქსირება',
        price: 22,
        duration: 25,
        category: 'waxing',
        isAvailable: true,
      },

      // PREMIUM WASH services
      {
        id: 'service_13',
        locationId: 'location_5',
        name: 'პრემიუმ სამრეცხაო',
        description: 'სრული სამრეცხაო + ვაქსირება + დეტეილინგი',
        price: 60,
        duration: 90,
        category: 'premium',
        isAvailable: true,
      },
      {
        id: 'service_14',
        locationId: 'location_5',
        name: 'ძრავის წმენდა',
        description: 'ძრავის კომპარტმენტის სრული გაწმენდა',
        price: 40,
        duration: 60,
        category: 'engine',
        isAvailable: true,
      },
      {
        id: 'service_15',
        locationId: 'location_5',
        name: 'ვაქსირება',
        description: 'ავტომობილის ვაქსირება',
        price: 30,
        duration: 30,
        category: 'waxing',
        isAvailable: true,
      },
      {
        id: 'service_16',
        locationId: 'location_5',
        name: 'დეტეილინგი',
        description: 'ავტომობილის სრული დეტეილინგი',
        price: 80,
        duration: 120,
        category: 'detailing',
        isAvailable: true,
      },
    ];

    for (const service of services) {
      await this.firebaseService.db
        .collection('carwash_services')
        .doc(service.id)
        .set(service);
    }

    console.log('✅ Car wash services seeded successfully!');
  }

  async seedTestBookings(): Promise<void> {
    const testBookings = [
      {
        id: 'booking_1',
        userId: 'user_123',
        locationId: 'location_1',
        locationName: 'CAR WASH CENTER',
        locationAddress: 'რუსთაველის გამზირი 15, თბილისი',
        serviceId: 'service_1',
        serviceName: 'სრული სამრეცხაო',
        servicePrice: 15,
        bookingDate: Date.now() + 24 * 60 * 60 * 1000, // tomorrow
        bookingTime: '15:30',
        carInfo: {
          make: 'Toyota',
          model: 'Camry',
          year: '2020',
          licensePlate: 'TB-123-AB',
          color: 'შავი',
        },
        customerInfo: {
          name: 'გიორგი ნათაძე',
          phone: '+995 555 123 456',
          email: 'giorgi@example.com',
        },
        status: 'confirmed' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'booking_2',
        userId: 'user_123',
        locationId: 'location_2',
        locationName: 'ALL CLEAN',
        locationAddress: 'აღმაშენებლის გამზირი 45, თბილისი',
        serviceId: 'service_4',
        serviceName: 'პრემიუმ სამრეცხაო',
        servicePrice: 40,
        bookingDate: Date.now() + 2 * 24 * 60 * 60 * 1000, // day after tomorrow
        bookingTime: '10:15',
        carInfo: {
          make: 'BMW',
          model: 'X5',
          year: '2021',
          licensePlate: 'TB-456-CD',
          color: 'თეთრი',
        },
        customerInfo: {
          name: 'გიორგი ნათაძე',
          phone: '+995 555 123 456',
          email: 'giorgi@example.com',
        },
        status: 'pending' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'booking_3',
        userId: 'user_123',
        locationId: 'location_3',
        locationName: 'LUCKY WASH',
        locationAddress: 'ვაზისუბნის ქუჩა 12, თბილისი',
        serviceId: 'service_7',
        serviceName: 'ძრავის წმენდა',
        servicePrice: 35,
        bookingDate: Date.now() - 24 * 60 * 60 * 1000, // yesterday
        bookingTime: '11:00',
        carInfo: {
          make: 'Mercedes',
          model: 'C-Class',
          year: '2019',
          licensePlate: 'TB-789-EF',
          color: 'ცისფერი',
        },
        customerInfo: {
          name: 'გიორგი ნათაძე',
          phone: '+995 555 123 456',
          email: 'giorgi@example.com',
        },
        status: 'completed' as const,
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 24 * 60 * 60 * 1000,
      },
      {
        id: 'booking_4',
        userId: 'user_456',
        locationId: 'location_4',
        locationName: 'SPARKLE CLEAN',
        locationAddress: 'პეკინის ქუჩა 8, თბილისი',
        serviceId: 'service_10',
        serviceName: 'სრული სამრეცხაო',
        servicePrice: 18,
        bookingDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // in 3 days
        bookingTime: '14:00',
        carInfo: {
          make: 'Audi',
          model: 'A4',
          year: '2022',
          licensePlate: 'TB-321-GH',
          color: 'წითელი',
        },
        customerInfo: {
          name: 'ანა სმითი',
          phone: '+995 555 987 654',
          email: 'ana@example.com',
        },
        status: 'confirmed' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'booking_5',
        userId: 'user_789',
        locationId: 'location_5',
        locationName: 'PREMIUM WASH',
        locationAddress: 'წერეთლის გამზირი 25, თბილისი',
        serviceId: 'service_13',
        serviceName: 'პრემიუმ სამრეცხაო',
        servicePrice: 60,
        bookingDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // in a week
        bookingTime: '16:30',
        carInfo: {
          make: 'Porsche',
          model: '911',
          year: '2023',
          licensePlate: 'TB-654-IJ',
          color: 'ყვითელი',
        },
        customerInfo: {
          name: 'დავით ჯონსონი',
          phone: '+995 555 456 789',
          email: 'david@example.com',
        },
        status: 'pending' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    for (const booking of testBookings) {
      await this.firebaseService.db
        .collection('carwash_bookings')
        .doc(booking.id)
        .set(booking);
    }

    console.log('✅ Test bookings seeded successfully!');
  }

  async seedAllData(): Promise<void> {
    try {
      console.log('🌱 Starting to seed car wash data...');

      await this.seedCarWashLocations();
      await this.seedCarWashServices();
      await this.seedTestBookings();

      console.log('🎉 All car wash data seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding data:', error);
      throw error;
    }
  }
}
