import { Module } from '@nestjs/common';
import { FirebaseModule } from './firebase/firebase.module';
import { RequestsModule } from './requests/requests.module';
import { OffersModule } from './offers/offers.module';
import { PartnersModule } from './partners/partners.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    FirebaseModule,
    RequestsModule,
    OffersModule,
    PartnersModule,
    MessagesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
