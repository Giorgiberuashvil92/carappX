import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import * as messagesService from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly service: messagesService.MessagesService) {}

  @Post()
  create(@Body() body: messagesService.MessageCreateDto) {
    return this.service.create(body);
  }

  @Get()
  list(@Query('offerId') offerId?: string) {
    if (!offerId) return [];
    return this.service.listByOffer(offerId);
  }
}
