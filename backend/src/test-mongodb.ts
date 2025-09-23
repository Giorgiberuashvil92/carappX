import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Import all schemas for testing
import {
  CarwashLocation,
  CarwashLocationDocument,
} from './carwash/schemas/carwash-location.schema';
import { Store, StoreDocument } from './stores/schemas/store.schema';
import { CarBooking, CarBookingDocument } from './schemas/car-booking.schema';
import { Car, CarDocument } from './schemas/car.schema';
import { Reminder, ReminderDocument } from './schemas/reminder.schema';
import { FuelEntry, FuelEntryDocument } from './schemas/fuel-entry.schema';
import { User, UserDocument } from './schemas/user.schema';
import { Otp, OtpDocument } from './schemas/otp.schema';
import {
  UserLocation,
  UserLocationDocument,
} from './schemas/user-location.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import {
  Recommendation,
  RecommendationDocument,
} from './schemas/recommendation.schema';
import { Offer, OfferDocument } from './schemas/offer.schema';
import {
  CommunityPost,
  CommunityPostDocument,
} from './schemas/community-post.schema';
import { Like, LikeDocument } from './schemas/like.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import {
  CommentLike,
  CommentLikeDocument,
} from './schemas/comment-like.schema';
import { Request, RequestDocument } from './schemas/request.schema';
import { PushToken, PushTokenDocument } from './schemas/push-token.schema';
import { PushLog, PushLogDocument } from './schemas/push-log.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import {
  PartnerToken,
  PartnerTokenDocument,
} from './schemas/partner-token.schema';

async function testMongoDB() {
  console.log('🧪 Testing MongoDB connection and all collections...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Test all collections
    const collections = [
      {
        name: 'CarwashLocation',
        model: app.get<Model<CarwashLocationDocument>>(
          getModelToken(CarwashLocation.name),
        ),
      },
      {
        name: 'Store',
        model: app.get<Model<StoreDocument>>(getModelToken(Store.name)),
      },
      {
        name: 'CarBooking',
        model: app.get<Model<CarBookingDocument>>(
          getModelToken(CarBooking.name),
        ),
      },
      {
        name: 'Car',
        model: app.get<Model<CarDocument>>(getModelToken(Car.name)),
      },
      {
        name: 'Reminder',
        model: app.get<Model<ReminderDocument>>(getModelToken(Reminder.name)),
      },
      {
        name: 'FuelEntry',
        model: app.get<Model<FuelEntryDocument>>(getModelToken(FuelEntry.name)),
      },
      {
        name: 'User',
        model: app.get<Model<UserDocument>>(getModelToken(User.name)),
      },
      {
        name: 'Otp',
        model: app.get<Model<OtpDocument>>(getModelToken(Otp.name)),
      },
      {
        name: 'UserLocation',
        model: app.get<Model<UserLocationDocument>>(
          getModelToken(UserLocation.name),
        ),
      },
      {
        name: 'Category',
        model: app.get<Model<CategoryDocument>>(getModelToken(Category.name)),
      },
      {
        name: 'Recommendation',
        model: app.get<Model<RecommendationDocument>>(
          getModelToken(Recommendation.name),
        ),
      },
      {
        name: 'Offer',
        model: app.get<Model<OfferDocument>>(getModelToken(Offer.name)),
      },
      {
        name: 'CommunityPost',
        model: app.get<Model<CommunityPostDocument>>(
          getModelToken(CommunityPost.name),
        ),
      },
      {
        name: 'Like',
        model: app.get<Model<LikeDocument>>(getModelToken(Like.name)),
      },
      {
        name: 'Comment',
        model: app.get<Model<CommentDocument>>(getModelToken(Comment.name)),
      },
      {
        name: 'CommentLike',
        model: app.get<Model<CommentLikeDocument>>(
          getModelToken(CommentLike.name),
        ),
      },
      {
        name: 'Request',
        model: app.get<Model<RequestDocument>>(getModelToken(Request.name)),
      },
      {
        name: 'PushToken',
        model: app.get<Model<PushTokenDocument>>(getModelToken(PushToken.name)),
      },
      {
        name: 'PushLog',
        model: app.get<Model<PushLogDocument>>(getModelToken(PushLog.name)),
      },
      {
        name: 'Message',
        model: app.get<Model<MessageDocument>>(getModelToken(Message.name)),
      },
      {
        name: 'PartnerToken',
        model: app.get<Model<PartnerTokenDocument>>(
          getModelToken(PartnerToken.name),
        ),
      },
    ];

    console.log('📊 Collection counts:');
    for (const collection of collections) {
      try {
        const count = await (collection.model as any).countDocuments();
        console.log(`  ${collection.name}: ${count} documents`);
      } catch (error) {
        console.log(`  ${collection.name}: ❌ Error - ${(error as Error).message}`);
      }
    }

    // Test sample data from carwash locations
    const carwashModel = app.get<Model<CarwashLocationDocument>>(
      getModelToken(CarwashLocation.name),
    );
    const sampleLocations = await carwashModel.find().limit(3);
    console.log(
      `🔍 Sample carwash locations:`,
      sampleLocations.map((l) => ({ id: l.id, name: l.name })),
    );

    console.log('✅ MongoDB connection and all collections working correctly!');
  } catch (error) {
    console.error('❌ MongoDB test failed:', error);
  } finally {
    await app.close();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testMongoDB().catch(console.error);
}

export { testMongoDB };
