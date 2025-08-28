import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import * as partnersService from './partners.service';

@Controller('partners')
export class PartnersController {
  constructor(private readonly service: partnersService.PartnersService) {}

  @Post('tokens')
  save(@Body() body: partnersService.PartnerTokenDto) {
    return this.service.saveToken(body);
  }

  @Get('tokens/:partnerId')
  get(@Param('partnerId') partnerId: string) {
    return this.service.getToken(partnerId);
  }

  @Get('tokens')
  list() {
    return this.service.list();
  }
}
