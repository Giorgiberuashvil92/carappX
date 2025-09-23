import { Body, Controller, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('start')
  start(@Body() body: { phone: string }) {
    console.log(
      `🚀 [AUTH_CONTROLLER] Start request received for phone: ${body?.phone}`,
    );
    return this.service.start(body?.phone);
  }

  @Post('verify')
  verify(@Body() body: { otpId: string; code: string }) {
    console.log(
      `🔐 [AUTH_CONTROLLER] Verify request received for OTP ID: ${body?.otpId}, Code: ${body?.code}`,
    );
    return this.service.verify(body?.otpId, body?.code);
  }

  @Post('complete')
  complete(
    @Body()
    body: {
      userId: string;
      firstName?: string;
      role?: 'user' | 'partner';
    },
  ) {
    return this.service.complete(body?.userId, {
      firstName: body?.firstName,
      role: body?.role,
    });
  }

  @Put('update-role')
  async updateRole(
    @Body()
    body: {
      userId: string;
      role: 'customer' | 'owner' | 'manager' | 'employee' | 'user';
    },
  ) {
    return await this.service.updateRole(body?.userId, body?.role);
  }

  @Put('update-owned-carwashes')
  async updateOwnedCarwashes(
    @Body()
    body: {
      userId: string;
      carwashId: string;
      action: 'add' | 'remove';
    },
  ) {
    return await this.service.updateOwnedCarwashes(
      body?.userId,
      body?.carwashId,
      body?.action,
    );
  }
}
