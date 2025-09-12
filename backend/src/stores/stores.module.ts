import { Module } from '@nestjs/common';

import { FirebaseModule } from '../firebase/firebase.module';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

@Module({
  imports: [FirebaseModule],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
