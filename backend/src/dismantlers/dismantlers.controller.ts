/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DismantlersService } from './dismantlers.service';
import { CreateDismantlerDto } from './dto/create-dismantler.dto';
import { UpdateDismantlerDto } from './dto/update-dismantler.dto';

@Controller('dismantlers')
export class DismantlersController {
  constructor(private readonly dismantlersService: DismantlersService) {}

  @Post()
  async create(@Body() createDismantlerDto: CreateDismantlerDto) {
    console.log('🚀 DismantlersController.create called');
    console.log(
      '📝 Request body:',
      JSON.stringify(createDismantlerDto, null, 2),
    );

    try {
      console.log('✅ Validation passed, calling service...');
      const data = await this.dismantlersService.create(createDismantlerDto);
      console.log('✅ Service returned:', JSON.stringify(data, null, 2));

      return {
        success: true,
        message: 'დაშლილების განცხადება წარმატებით შეიქმნა',
        data,
      };
    } catch (error) {
      console.error('❌ Error in create:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);

      throw new BadRequestException({
        success: false,
        message: error.message as string,
      });
    }
  }

  @Get()
  async findAll(
    @Query('brand') brand?: string,
    @Query('model') model?: string,
    @Query('yearFrom') yearFrom?: string,
    @Query('yearTo') yearTo?: string,
    @Query('location') location?: string,
    @Query('status') status?: string,
  ) {
    const filters = {
      brand,
      model,
      yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
      yearTo: yearTo ? parseInt(yearTo) : undefined,
      location,
      status,
    };

    const dismantlers = await this.dismantlersService.findAll(filters);

    return {
      success: true,
      message: 'დაშლილების განცხადებები წარმატებით ჩამოიტვირთა',
      data: dismantlers,
      count: dismantlers.length,
    };
  }

  @Get('featured')
  getFeatured() {
    return {
      success: true,
      message: 'რეკომენდებული დაშლილები',
      data: this.dismantlersService.getFeatured(),
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
      data: this.dismantlersService.searchByKeyword(keyword),
    };
  }

  @Get('brand/:brand')
  getByBrand(@Param('brand') brand: string) {
    return {
      success: true,
      message: `${brand} ბრენდის დაშლილები`,
      data: this.dismantlersService.getByBrand(brand),
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return {
        success: true,
        message: 'დაშლილების განცხადება',
        data: this.dismantlersService.findOne(id),
      };
    } catch (error) {
      throw new NotFoundException({
        success: false,
        message: error.message as string,
      });
    }
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDismantlerDto: UpdateDismantlerDto,
  ) {
    try {
      return {
        success: true,
        message: 'დაშლილების განცხადება წარმატებით განახლდა',
        data: this.dismantlersService.update(id, updateDismantlerDto),
      };
    } catch (error) {
      if (error.message?.includes('ვერ მოიძებნა')) {
        throw new NotFoundException({
          success: false,
          message: error.message as string,
        });
      }
      throw new BadRequestException({
        success: false,
        message: error.message as string,
      });
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      this.dismantlersService.remove(id);
      return {
        success: true,
        message: 'დაშლილების განცხადება წარმატებით წაიშალა',
      };
    } catch (error) {
      throw new NotFoundException({
        success: false,
        message: error.message as string,
      });
    }
  }
}
