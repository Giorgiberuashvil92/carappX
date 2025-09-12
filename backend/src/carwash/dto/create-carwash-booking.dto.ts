export class CreateCarwashBookingDto {
  userId: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  bookingDate: number; // timestamp
  bookingTime: string; // "15:30"
  carInfo: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    color?: string;
  };
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  notes?: string;
  estimatedDuration?: number; // in minutes
  specialRequests?: string[];
}
