import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  create(@Body() createOfferDto: CreateOfferDto) {
    return this.offersService.create(createOfferDto);
  }

  // removed duplicate seed-basic

  @Get()
  findAll(
    @Query('requestId') requestId?: string,
    @Query('partnerId') partnerId?: string,
  ) {
    return this.offersService.findAll(requestId, partnerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOfferDto: UpdateOfferDto) {
    return this.offersService.update(id, updateOfferDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offersService.remove(id);
  }

  @Post('seed-basic')
  seed() {
    // minimal seed for testing targeting
    const batch = [
      {
        requestId: 'seed_req_1',
        partnerId: 'partner_fast_oil',
        providerName: 'Fast Oil Express',
        priceGEL: 95,
        etaMin: 60,
        distanceKm: 2.3,
        tags: ['ზეთი', 'სწრაფი'],
        targeting: {
          serviceTypes: ['oil_change'],
          carMakes: ['Toyota', 'Honda'],
          city: 'Tbilisi',
        },
      },
      {
        requestId: 'seed_req_2',
        partnerId: 'partner_tire_hub',
        providerName: 'Tire Hub',
        priceGEL: 80,
        etaMin: 45,
        distanceKm: 1.1,
        tags: ['საბურავი'],
        targeting: { serviceTypes: ['tires'], city: 'Tbilisi' },
      },
      {
        requestId: 'seed_req_3',
        partnerId: 'partner_premium_auto',
        providerName: 'Premium Auto Care',
        priceGEL: 150,
        etaMin: 90,
        distanceKm: 5.0,
        tags: ['პრემიუმ'],
        targeting: {
          serviceTypes: ['oil_change', 'service'],
          carMakes: ['BMW'],
          city: 'Tbilisi',
        },
      },
    ];
    return Promise.all(
      batch.map((d) => this.offersService.create(d as CreateOfferDto)),
    );
  }
}
