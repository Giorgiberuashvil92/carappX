import { Module } from '@nestjs/common';
import { GarageService } from './garage.service';
import { GarageController } from './garage.controller';
import { OffersModule } from '../offers/offers.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [OffersModule, RecommendationsModule],
  controllers: [GarageController],
  providers: [GarageService],
  exports: [GarageService],
})
export class GarageModule {}
