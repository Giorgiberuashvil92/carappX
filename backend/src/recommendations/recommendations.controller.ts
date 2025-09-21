import { Controller, Post } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Post('seed-basic')
  async seed() {
    const batch = [
      {
        providerName: 'Fast Oil Express',
        priceGEL: 95,
        etaMin: 60,
        distanceKm: 2.3,
        tags: ['ზეთი', 'სწრაფი'],
        partnerId: 'partner_fast_oil',
        targeting: {
          serviceTypes: ['oil_change'],
          carMakes: ['Toyota', 'Honda'],
          city: 'Tbilisi',
        },
      },
      {
        providerName: 'Tire Hub',
        priceGEL: 80,
        etaMin: 45,
        distanceKm: 1.1,
        tags: ['საბურავი'],
        partnerId: 'partner_tire_hub',
        targeting: { serviceTypes: ['tires'], city: 'Tbilisi' },
      },
      {
        providerName: 'Premium Auto Care',
        priceGEL: 150,
        etaMin: 90,
        distanceKm: 5.0,
        tags: ['პრემიუმ'],
        partnerId: 'partner_premium_auto',
        targeting: {
          serviceTypes: ['oil_change', 'service'],
          carMakes: ['BMW'],
          city: 'Tbilisi',
        },
      },
    ];
    return Promise.all(batch.map((p) => this.service.create(p)));
  }
}
