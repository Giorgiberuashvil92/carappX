import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { FirebaseModule } from '../firebase/firebase.module';
import {
  CommunityPost,
  CommunityLike,
  CommunityComment,
} from './entities/community-post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommunityPost, CommunityLike, CommunityComment]),
    FirebaseModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
