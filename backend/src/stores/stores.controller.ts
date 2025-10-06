import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  async create(@Body() createStoreDto: CreateStoreDto) {
    try {
      return {
        success: true,
        message: 'მაღაზია წარმატებით დარეგისტრირდა',
        data: await this.storesService.create(createStoreDto),
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('location') location?: string,
    @Query('status') status?: string,
  ) {
    const filters = { type, location, status };
    const stores = await this.storesService.findAll(filters);

    return {
      success: true,
      message: 'მაღაზიები წარმატებით ჩამოიტვირთა',
      data: stores,
      count: stores.length,
    };
  }

  @Get('search')
  search(@Query('q') keyword: string) {
    if (!keyword) {
      throw new BadRequestException({
        success: false,
        message: 'საძიებო სიტყვა აუცილებელია',
      });
    }

    return {
      success: true,
      message: 'ძიების შედეგები',
      data: this.storesService.searchByKeyword(keyword),
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return {
        success: true,
        message: 'მაღაზიის დეტალები',
        data: this.storesService.findOne(id),
      };
    } catch (error) {
      throw new NotFoundException({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateStoreDto: any) {
    try {
      return {
        success: true,
        message: 'მაღაზია წარმატებით განახლდა',
        data: await this.storesService.update(id, updateStoreDto),
      };
    } catch (error) {
      if (error instanceof Error && error.message?.includes('ვერ მოიძებნა')) {
        throw new NotFoundException({
          success: false,
          message: error.message,
        });
      }
      throw new BadRequestException({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.storesService.remove(id);
      return {
        success: true,
        message: 'მაღაზია წარმატებით წაიშალა',
      };
    } catch (error) {
      throw new NotFoundException({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
