import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Post('register')
  register(
    @Body()
    body: {
      token: string;
      role: 'user' | 'partner';
      userId?: string;
      partnerId?: string;
    },
  ) {
    return this.svc.registerToken(body.token, {
      role: body.role,
      userId: body.userId,
      partnerId: body.partnerId,
    });
  }
}
