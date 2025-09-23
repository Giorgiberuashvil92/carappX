import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FirebaseService } from '../firebase/firebase.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Import all schemas
import {
  CarwashLocation,
  CarwashLocationDocument,
} from '../carwash/schemas/carwash-location.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';
import { CarBooking, CarBookingDocument } from '../schemas/car-booking.schema';
import { Car, CarDocument } from '../schemas/car.schema';
import { Reminder, ReminderDocument } from '../schemas/reminder.schema';
import { FuelEntry, FuelEntryDocument } from '../schemas/fuel-entry.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Otp, OtpDocument } from '../schemas/otp.schema';
import {
  UserLocation,
  UserLocationDocument,
} from '../schemas/user-location.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import {
  Recommendation,
  RecommendationDocument,
} from '../schemas/recommendation.schema';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import {
  CommunityPost,
  CommunityPostDocument,
} from '../schemas/community-post.schema';
import { Like, LikeDocument } from '../schemas/like.schema';
import { Comment, CommentDocument } from '../schemas/comment.schema';
import {
  CommentLike,
  CommentLikeDocument,
} from '../schemas/comment-like.schema';
import { Request, RequestDocument } from '../schemas/request.schema';
import { PushToken, PushTokenDocument } from '../schemas/push-token.schema';
import { PushLog, PushLogDocument } from '../schemas/push-log.schema';
import { Message, MessageDocument } from '../schemas/message.schema';
import {
  PartnerToken,
  PartnerTokenDocument,
} from '../schemas/partner-token.schema';

async function migrateToMongoDB() {
  console.log(
    '🚀 Starting comprehensive migration from Firestore to MongoDB...',
  );

  const app = await NestFactory.createApplicationContext(AppModule);
  const firebaseService = app.get(FirebaseService);

  // Get all MongoDB models
  const models = {
    carwash: app.get<Model<CarwashLocationDocument>>(
      getModelToken(CarwashLocation.name),
    ),
    store: app.get<Model<StoreDocument>>(getModelToken(Store.name)),
    carBooking: app.get<Model<CarBookingDocument>>(
      getModelToken(CarBooking.name),
    ),
    car: app.get<Model<CarDocument>>(getModelToken(Car.name)),
    reminder: app.get<Model<ReminderDocument>>(getModelToken(Reminder.name)),
    fuelEntry: app.get<Model<FuelEntryDocument>>(getModelToken(FuelEntry.name)),
    user: app.get<Model<UserDocument>>(getModelToken(User.name)),
    otp: app.get<Model<OtpDocument>>(getModelToken(Otp.name)),
    userLocation: app.get<Model<UserLocationDocument>>(
      getModelToken(UserLocation.name),
    ),
    category: app.get<Model<CategoryDocument>>(getModelToken(Category.name)),
    recommendation: app.get<Model<RecommendationDocument>>(
      getModelToken(Recommendation.name),
    ),
    offer: app.get<Model<OfferDocument>>(getModelToken(Offer.name)),
    communityPost: app.get<Model<CommunityPostDocument>>(
      getModelToken(CommunityPost.name),
    ),
    like: app.get<Model<LikeDocument>>(getModelToken(Like.name)),
    comment: app.get<Model<CommentDocument>>(getModelToken(Comment.name)),
    commentLike: app.get<Model<CommentLikeDocument>>(
      getModelToken(CommentLike.name),
    ),
    request: app.get<Model<RequestDocument>>(getModelToken(Request.name)),
    pushToken: app.get<Model<PushTokenDocument>>(getModelToken(PushToken.name)),
    pushLog: app.get<Model<PushLogDocument>>(getModelToken(PushLog.name)),
    message: app.get<Model<MessageDocument>>(getModelToken(Message.name)),
    partnerToken: app.get<Model<PartnerTokenDocument>>(
      getModelToken(PartnerToken.name),
    ),
  };

  // Migration configuration
  const collections = [
    {
      name: 'carwash_locations',
      model: models.carwash,
      label: 'Carwash Locations',
    },
    { name: 'stores', model: models.store, label: 'Stores' },
    {
      name: 'carwash_bookings',
      model: models.carBooking,
      label: 'Car Bookings',
    },
    { name: 'cars', model: models.car, label: 'Cars' },
    { name: 'reminders', model: models.reminder, label: 'Reminders' },
    { name: 'fuel_entries', model: models.fuelEntry, label: 'Fuel Entries' },
    { name: 'users', model: models.user, label: 'Users' },
    { name: 'otps', model: models.otp, label: 'OTPs' },
    {
      name: 'user_locations',
      model: models.userLocation,
      label: 'User Locations',
    },
    { name: 'categories', model: models.category, label: 'Categories' },
    {
      name: 'recommendations',
      model: models.recommendation,
      label: 'Recommendations',
    },
    { name: 'offers', model: models.offer, label: 'Offers' },
    { name: 'posts', model: models.communityPost, label: 'Community Posts' },
    { name: 'likes', model: models.like, label: 'Likes' },
    { name: 'comments', model: models.comment, label: 'Comments' },
    {
      name: 'comment_likes',
      model: models.commentLike,
      label: 'Comment Likes',
    },
    { name: 'requests', model: models.request, label: 'Requests' },
    { name: 'push_tokens', model: models.pushToken, label: 'Push Tokens' },
    { name: 'push_logs', model: models.pushLog, label: 'Push Logs' },
    { name: 'messages', model: models.message, label: 'Messages' },
    {
      name: 'partner_tokens',
      model: models.partnerToken,
      label: 'Partner Tokens',
    },
  ];

  try {
    let totalMigrated = 0;

    for (const collection of collections) {
      try {
        console.log(`📦 Migrating ${collection.label}...`);
        const snapshot = await firebaseService.db
          .collection(collection.name)
          .get();
        const data = snapshot.docs.map((doc) => ({
          ...doc.data(),
          _id: doc.id, // MongoDB will use this as _id
        }));

        if (data.length > 0) {
          try {
            await (collection.model as any).insertMany(data, { ordered: false });
            console.log(
              `✅ Migrated ${data.length} ${collection.label.toLowerCase()}`,
            );
            totalMigrated += data.length;
          } catch (insertError) {
            console.log(
              `⚠️  Some documents already exist in ${collection.label}, skipping duplicates`,
            );
            // Try to insert one by one to handle duplicates
            let successCount = 0;
            for (const doc of data) {
              try {
                await (collection.model as any).create(doc);
                successCount++;
              } catch (docError) {
                // Skip duplicate documents
              }
            }
            if (successCount > 0) {
              console.log(
                `✅ Migrated ${successCount} new ${collection.label.toLowerCase()}`,
              );
              totalMigrated += successCount;
            }
          }
        } else {
          console.log(`ℹ️  No data found for ${collection.label}`);
        }
      } catch (error) {
        console.error(
          `❌ Failed to migrate ${collection.label}:`,
          error.message,
        );
        // Continue with other collections
      }
    }

    console.log(
      `🎉 Migration completed! Total records migrated: ${totalMigrated}`,
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await app.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToMongoDB().catch(console.error);
}

export { migrateToMongoDB };
