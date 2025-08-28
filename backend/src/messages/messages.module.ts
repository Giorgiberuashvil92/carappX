import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [FirebaseModule, NotificationsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
