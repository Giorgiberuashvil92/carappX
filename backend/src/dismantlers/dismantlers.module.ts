import { Module } from '@nestjs/common';

import { FirebaseModule } from '../firebase/firebase.module';
import { DismantlersController } from './dismantlers.controller';
import { DismantlersService } from './dismantlers.service';

@Module({
  imports: [FirebaseModule],
  controllers: [DismantlersController],
  providers: [DismantlersService],
  exports: [DismantlersService],
})
export class DismantlersModule {}
