export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  imageUri?: string;
  lastService?: Date;
  nextService?: Date;
}

export interface ServiceHistory {
  id: string;
  carId: string;
  serviceType: string;
  date: Date;
  mileage: number;
  cost: number;
  description: string;
  provider: string;
}

export interface GarageState {
  cars: Car[];
  selectedCarId: string | null;
  serviceHistory: ServiceHistory[];
}
