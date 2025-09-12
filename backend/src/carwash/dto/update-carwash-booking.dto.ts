export class UpdateCarwashBookingDto {
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  bookingDate?: number;
  bookingTime?: string;
  notes?: string;
  specialRequests?: string[];
  estimatedDuration?: number;
  actualDuration?: number;
  rating?: number;
  review?: string;
}
