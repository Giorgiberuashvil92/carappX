import { Module } from '@nestjs/common';
import { CarwashService } from './carwash.service';
import { CarwashController } from './carwash.controller';
import { CarWashSeedData } from './seed-data';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [CarwashController],
  providers: [CarwashService, CarWashSeedData],
  exports: [CarwashService],
})
export class CarwashModule {}
