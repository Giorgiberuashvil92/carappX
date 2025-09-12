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
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';

@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Post()
  async create(@Body() createPartDto: CreatePartDto) {
    try {
      const data = await this.partsService.create(createPartDto);
      return {
        success: true,
        message: 'ნაწილი წარმატებით დაემატა',
        data,
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
    @Query('category') category?: string,
    @Query('condition') condition?: string,
    @Query('brand') brand?: string,
    @Query('model') model?: string,
    @Query('location') location?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('status') status?: string,
  ) {
    const filters: {
      category?: string;
      condition?: string;
      brand?: string;
      model?: string;
      location?: string;
      status?: string;
      priceRange?: { min: number; max: number };
    } = {
      category,
      condition,
      brand,
      model,
      location,
      status,
    };

    if (minPrice || maxPrice) {
      filters.priceRange = {
        min: minPrice ? parseFloat(minPrice) : 0,
        max: maxPrice ? parseFloat(maxPrice) : Infinity,
      };
    }

    const parts = await this.partsService.findAll(filters);

    return {
      success: true,
      message: 'ნაწილები წარმატებით ჩამოიტვირთა',
      data: parts,
      count: parts.length,
    };
  }

  @Get('featured')
  getFeatured() {
    return {
      success: true,
      message: 'რეკომენდებული ნაწილები',
      data: this.partsService.getFeatured(),
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
      data: this.partsService.searchByKeyword(keyword),
    };
  }

  @Get('category/:category')
  getByCategory(@Param('category') category: string) {
    return {
      success: true,
      message: `${category} კატეგორიის ნაწილები`,
      data: this.partsService.getByCategory(category),
    };
  }

  @Get('brand/:brand')
  getByBrand(@Param('brand') brand: string) {
    return {
      success: true,
      message: `${brand} ბრენდის ნაწილები`,
      data: this.partsService.getByBrand(brand),
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return {
        success: true,
        message: 'ნაწილის დეტალები',
        data: this.partsService.findOne(id),
      };
    } catch (error) {
      throw new NotFoundException({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartDto: UpdatePartDto) {
    try {
      return {
        success: true,
        message: 'ნაწილი წარმატებით განახლდა',
        data: this.partsService.update(id, updatePartDto),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('ვერ მოიძებნა')) {
        console.log('Error message:', errorMessage);
        throw new NotFoundException({
          success: false,
          message: errorMessage,
        });
      }
      console.log('Error message:', errorMessage);
      throw new BadRequestException({
        success: false,
        message: errorMessage,
      });
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      this.partsService.remove(id);
      return {
        success: true,
        message: 'ნაწილი წარმატებით წაიშალა',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.log('Error message:', errorMessage);
      throw new NotFoundException({
        success: false,
        message: errorMessage,
      });
    }
  }
}
