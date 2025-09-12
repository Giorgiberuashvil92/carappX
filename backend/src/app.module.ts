import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirebaseModule } from './firebase/firebase.module';
import { RequestsModule } from './requests/requests.module';
import { OffersModule } from './offers/offers.module';
import { PartnersModule } from './partners/partners.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { CarwashModule } from './carwash/carwash.module';
import { GarageModule } from './garage/garage.module';
import { DismantlersModule } from './dismantlers/dismantlers.module';
import { PartsModule } from './parts/parts.module';
import { StoresModule } from './stores/stores.module';

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
    PartnersModule,
    MessagesModule,
    NotificationsModule,
    AuthModule,
    CarwashModule,
    GarageModule,
    DismantlersModule,
    PartsModule,
    StoresModule,
  ],
})
export class AppModule {}
