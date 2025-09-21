import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirebaseModule } from './firebase/firebase.module';
import { RequestsModule } from './requests/requests.module';
import { OffersModule } from './offers/offers.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { PartnersModule } from './partners/partners.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { CarwashModule } from './carwash/carwash.module';
import { GarageModule } from './garage/garage.module';
import { DismantlersModule } from './dismantlers/dismantlers.module';
import { PartsModule } from './parts/parts.module';
import { StoresModule } from './stores/stores.module';
import { CommunityModule } from './community/community.module';
import { CategoriesModule } from './categories/categories.module';
import { LocationModule } from './location/location.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'carapp.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Development only
      logging: true,
    }),
    FirebaseModule,
    RequestsModule,
    OffersModule,
    RecommendationsModule,
    PartnersModule,
    MessagesModule,
    NotificationsModule,
    AuthModule,
    CarwashModule,
    GarageModule,
    DismantlersModule,
    PartsModule,
    StoresModule,
    CommunityModule,
    CategoriesModule,
    LocationModule,
  ],
})
export class AppModule {}
