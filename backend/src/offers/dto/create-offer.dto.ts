export class CreateOfferDto {
  requestId: string;
  partnerId: string;
  providerName: string;
  priceGEL: number;
  etaMin: number;
  note?: string;
  distanceKm?: number;
  tags?: string[];
  targeting?: {
    serviceTypes?: string[]; // e.g. ['oil_change','tires']
    carMakes?: string[]; // e.g. ['Toyota','BMW']
    carModels?: string[]; // e.g. ['Camry','3 Series']
    city?: string; // e.g. 'Tbilisi'
  };
}
