import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import * as messagesService from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly service: messagesService.MessagesService) {}

  @Post()
  async create(@Body() body: messagesService.MessageCreateDto) {
    // Basic validation and logging

    console.log('[API] POST /messages body =', body);
    const hasOffer =
      typeof body?.offerId === 'string' && body.offerId.length > 0;
    const hasAuthor = body?.author === 'user' || body?.author === 'partner';
    const hasText =
      typeof body?.text === 'string' && body.text.trim().length > 0;
    if (!hasOffer || !hasAuthor || !hasText) {
      console.log('[API] /messages validation failed:', {
        hasOffer,
        hasAuthor,
        hasText,
      });
      throw new BadRequestException('Invalid message payload');
    }
    try {
      const saved = await this.service.create({
        offerId: body.offerId,
        author: body.author,
        text: body.text.trim(),
      });
      return saved;
    } catch (err) {
      console.log('[API] /messages error:', err);
      throw err;
    }
  }

  @Get()
  list(@Query('offerId') offerId?: string) {
    if (!offerId) return [];
    return this.service.listByOffer(offerId);
  }
}
