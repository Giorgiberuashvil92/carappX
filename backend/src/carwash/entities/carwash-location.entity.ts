export interface CarwashService {
  id: string;
  name: string;
  price: number;
  duration: number; // წუთებში
  description?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  bookedBy?: string;
}

export interface DaySlots {
  date: string;
  slots: TimeSlot[];
}

export interface WorkingDay {
  day: string; // monday, tuesday, etc.
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

export interface BreakTime {
  start: string;
  end: string;
  name: string;
}

export interface TimeSlotsConfig {
  workingDays: WorkingDay[];
  interval: number; // წუთებში (30, 60, etc.)
  breakTimes: BreakTime[];
}

export interface RealTimeStatus {
  isOpen: boolean;
  currentWaitTime: number; // წუთებში
  currentQueue: number;
  estimatedWaitTime: number; // წუთებში
  lastStatusUpdate: number;
}

export interface CarwashLocation {
  id: string;
  name: string;
  phone: string;
  category: string;
  location: string;
  address: string;
  price: number;
  rating: number;
  reviews: number;
  services: string; // ძველი ველი - backward compatibility
  detailedServices: CarwashService[]; // ახალი დეტალური სერვისები
  features?: string;
  workingHours: string; // ძველი ველი - backward compatibility
  timeSlotsConfig: TimeSlotsConfig; // ახალი დროის სლოტების კონფიგურაცია
  availableSlots: DaySlots[]; // ხელმისაწვდომი სლოტები
  realTimeStatus: RealTimeStatus; // რეალური დროის სტატუსი
  images?: string[];
  description: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean; // ძველი ველი - backward compatibility
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}
