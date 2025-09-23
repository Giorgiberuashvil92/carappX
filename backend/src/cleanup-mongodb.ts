import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Import all our schemas
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
import { UserLocation, UserLocationDocument } from './schemas/user-location.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Recommendation, RecommendationDocument } from './schemas/recommendation.schema';
import { Offer, OfferDocument } from './schemas/offer.schema';
import { CommunityPost, CommunityPostDocument } from './schemas/community-post.schema';
import { Like, LikeDocument } from './schemas/like.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CommentLike, CommentLikeDocument } from './schemas/comment-like.schema';
import { Request, RequestDocument } from './schemas/request.schema';
import { PushToken, PushTokenDocument } from './schemas/push-token.schema';
import { PushLog, PushLogDocument } from './schemas/push-log.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { PartnerToken, PartnerTokenDocument } from './schemas/partner-token.schema';

async function cleanupMongoDB() {
  console.log('🧹 Starting MongoDB cleanup - removing all old collections...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get all our models
    const ourModels = [
      { name: 'CarwashLocation', model: app.get<Model<CarwashLocationDocument>>(getModelToken(CarwashLocation.name)) },
      { name: 'Store', model: app.get<Model<StoreDocument>>(getModelToken(Store.name)) },
      { name: 'CarBooking', model: app.get<Model<CarBookingDocument>>(getModelToken(CarBooking.name)) },
      { name: 'Car', model: app.get<Model<CarDocument>>(getModelToken(Car.name)) },
      { name: 'Reminder', model: app.get<Model<ReminderDocument>>(getModelToken(Reminder.name)) },
      { name: 'FuelEntry', model: app.get<Model<FuelEntryDocument>>(getModelToken(FuelEntry.name)) },
      { name: 'User', model: app.get<Model<UserDocument>>(getModelToken(User.name)) },
      { name: 'Otp', model: app.get<Model<OtpDocument>>(getModelToken(Otp.name)) },
      { name: 'UserLocation', model: app.get<Model<UserLocationDocument>>(getModelToken(UserLocation.name)) },
      { name: 'Category', model: app.get<Model<CategoryDocument>>(getModelToken(Category.name)) },
      { name: 'Recommendation', model: app.get<Model<RecommendationDocument>>(getModelToken(Recommendation.name)) },
      { name: 'Offer', model: app.get<Model<OfferDocument>>(getModelToken(Offer.name)) },
      { name: 'CommunityPost', model: app.get<Model<CommunityPostDocument>>(getModelToken(CommunityPost.name)) },
      { name: 'Like', model: app.get<Model<LikeDocument>>(getModelToken(Like.name)) },
      { name: 'Comment', model: app.get<Model<CommentDocument>>(getModelToken(Comment.name)) },
      { name: 'CommentLike', model: app.get<Model<CommentLikeDocument>>(getModelToken(CommentLike.name)) },
      { name: 'Request', model: app.get<Model<RequestDocument>>(getModelToken(Request.name)) },
      { name: 'PushToken', model: app.get<Model<PushTokenDocument>>(getModelToken(PushToken.name)) },
      { name: 'PushLog', model: app.get<Model<PushLogDocument>>(getModelToken(PushLog.name)) },
      { name: 'Message', model: app.get<Model<MessageDocument>>(getModelToken(Message.name)) },
      { name: 'PartnerToken', model: app.get<Model<PartnerTokenDocument>>(getModelToken(PartnerToken.name)) },
    ];

    // Get our collection names
    const ourCollectionNames = ourModels.map(m => m.model.collection.name);
    console.log('📋 Our collections:', ourCollectionNames);

    // Get MongoDB connection
    const mongoose = require('mongoose');
    
    // Wait for connection to be ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => {
        mongoose.connection.once('connected', resolve);
      });
    }
    
    const db = mongoose.connection.db;

    // Get all collections in the database
    const allCollections = await db.listCollections().toArray();
    console.log('📊 All collections in database:', allCollections.map(c => c.name));

    // Find collections to delete (not in our list)
    const collectionsToDelete = allCollections
      .map(c => c.name)
      .filter(name => !ourCollectionNames.includes(name));

    console.log('🗑️ Collections to delete:', collectionsToDelete);

    if (collectionsToDelete.length === 0) {
      console.log('✅ No old collections found to delete!');
    } else {
      // Delete old collections
      for (const collectionName of collectionsToDelete) {
        try {
          await db.collection(collectionName).drop();
          console.log(`✅ Deleted collection: ${collectionName}`);
        } catch (error) {
          console.log(`⚠️ Could not delete collection ${collectionName}:`, (error as Error).message);
        }
      }
    }

    // Clear our collections (remove all documents)
    console.log('🧹 Clearing our collections...');
    for (const model of ourModels) {
      try {
        const result = await (model.model as any).deleteMany({});
        console.log(`✅ Cleared ${model.name}: ${result.deletedCount} documents`);
      } catch (error) {
        console.log(`⚠️ Could not clear ${model.name}:`, (error as Error).message);
      }
    }

    console.log('🎉 MongoDB cleanup completed!');
    console.log('📊 Final collection counts:');
    for (const model of ourModels) {
      try {
        const count = await (model.model as any).countDocuments();
        console.log(`  ${model.name}: ${count} documents`);
      } catch (error) {
        console.log(`  ${model.name}: Error - ${(error as Error).message}`);
      }
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await app.close();
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupMongoDB().catch(console.error);
}

export { cleanupMongoDB };
