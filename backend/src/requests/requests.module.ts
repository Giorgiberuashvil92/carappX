import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { OffersModule } from '../offers/offers.module';
import { Request, RequestSchema } from '../schemas/request.schema';

@Module({
  imports: [
    OffersModule,
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
