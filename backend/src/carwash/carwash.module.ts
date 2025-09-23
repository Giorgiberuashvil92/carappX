import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarwashService } from './carwash.service';
import { CarwashController } from './carwash.controller';
import { CarWashSeedData } from './seed-data';
import { FirebaseModule } from '../firebase/firebase.module';
import { CarwashLocation, CarwashLocationSchema } from './schemas/carwash-location.schema';

@Module({
  imports: [
    FirebaseModule,
    MongooseModule.forFeature([
      { name: CarwashLocation.name, schema: CarwashLocationSchema },
    ]),
  ],
  controllers: [CarwashController],
  providers: [CarwashService, CarWashSeedData],
  exports: [CarwashService],
})
export class CarwashModule {}
