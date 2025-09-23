import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CarwashLocation,
  CarwashLocationSchema,
} from '../carwash/schemas/carwash-location.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';

// Import all new schemas
import { CarBooking, CarBookingSchema } from '../schemas/car-booking.schema';
import { Car, CarSchema } from '../schemas/car.schema';
import { Reminder, ReminderSchema } from '../schemas/reminder.schema';
import { FuelEntry, FuelEntrySchema } from '../schemas/fuel-entry.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Otp, OtpSchema } from '../schemas/otp.schema';
import {
  UserLocation,
  UserLocationSchema,
} from '../schemas/user-location.schema';
import { Category, CategorySchema } from '../schemas/category.schema';
import {
  Recommendation,
  RecommendationSchema,
} from '../schemas/recommendation.schema';
import { Offer, OfferSchema } from '../schemas/offer.schema';
import {
  CommunityPost,
  CommunityPostSchema,
} from '../schemas/community-post.schema';
import { Like, LikeSchema } from '../schemas/like.schema';
import { Comment, CommentSchema } from '../schemas/comment.schema';
import { CommentLike, CommentLikeSchema } from '../schemas/comment-like.schema';
import { Request, RequestSchema } from '../schemas/request.schema';
import { PushToken, PushTokenSchema } from '../schemas/push-token.schema';
import { PushLog, PushLogSchema } from '../schemas/push-log.schema';
import { Message, MessageSchema } from '../schemas/message.schema';
import {
  PartnerToken,
  PartnerTokenSchema,
} from '../schemas/partner-token.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        'mongodb+srv://gberuashvili92:aegzol2o3jC31sj3@cluster0.hqqyz.mongodb.net/carappx?retryWrites=true&w=majority&appName=Cluster0',
    ),
    MongooseModule.forFeature([
      // Existing schemas
      { name: CarwashLocation.name, schema: CarwashLocationSchema },
      { name: Store.name, schema: StoreSchema },

      // New schemas
      { name: CarBooking.name, schema: CarBookingSchema },
      { name: Car.name, schema: CarSchema },
      { name: Reminder.name, schema: ReminderSchema },
      { name: FuelEntry.name, schema: FuelEntrySchema },
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: UserLocation.name, schema: UserLocationSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: CommunityPost.name, schema: CommunityPostSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: CommentLike.name, schema: CommentLikeSchema },
      { name: Request.name, schema: RequestSchema },
      { name: PushToken.name, schema: PushTokenSchema },
      { name: PushLog.name, schema: PushLogSchema },
      { name: Message.name, schema: MessageSchema },
      { name: PartnerToken.name, schema: PartnerTokenSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongoDBModule {}
