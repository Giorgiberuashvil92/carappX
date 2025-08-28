export class CreateOfferDto {
  requestId: string;
  partnerId: string;
  providerName: string;
  priceGEL: number;
  etaMin: number;
  note?: string;
}
