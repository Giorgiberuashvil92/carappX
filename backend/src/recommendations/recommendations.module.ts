import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { Recommendation, RecommendationSchema } from '../schemas/recommendation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Recommendation.name, schema: RecommendationSchema }]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
