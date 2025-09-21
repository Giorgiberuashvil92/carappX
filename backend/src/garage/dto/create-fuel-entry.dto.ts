export class CreateFuelEntryDto {
  carId: string;
  date: string; // ISO date
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  mileage: number;
}
