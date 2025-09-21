import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get('popular')
  async findPopular(@Query('limit') limit?: string): Promise<Category[]> {
    return this.categoriesService.findPopular(limit ? parseInt(limit) : 6);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Category | null> {
    return this.categoriesService.findById(id);
  }

  @Get(':id/stats')
  async getCategoryStats(@Param('id') id: string) {
    return this.categoriesService.getCategoryStats(id);
  }

  @Post(':id/view')
  async incrementViewCount(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.categoriesService.incrementViewCount(id);
    return { success: true };
  }

  @Post(':id/click')
  async incrementClickCount(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.categoriesService.incrementClickCount(id);
    return { success: true };
  }

  @Post()
  async create(
    @Body() category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Category> {
    return this.categoriesService.create(category);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updates: Partial<Category>,
  ): Promise<void> {
    return this.categoriesService.update(id, updates);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.categoriesService.delete(id);
  }

  @Post('seed/basic')
  async seedBasicCategories(): Promise<{ message: string; count: number }> {
    const categories = [
      {
        name: 'ავტოსერვისი',
        nameEn: 'Auto Service',
        description: 'ძრავის მოვლა, ზეთის შეცვლა, ტექდათვალიერება',
        icon: 'car-sport',
        color: '#3B82F6',
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=600&auto=format&fit=crop',
        isActive: true,
        order: 1,
        serviceTypes: ['service', 'maintenance', 'inspection'],
      },
      {
        name: 'სამრეცხაო',
        nameEn: 'Car Wash',
        description: 'მანქანის გარე და შიდა გაწმენდა',
        icon: 'water',
        color: '#22C55E',
        image:
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop',
        isActive: true,
        order: 2,
        serviceTypes: ['cleaning', 'detailing', 'waxing'],
      },
      {
        name: 'ელექტრო სისტემა',
        nameEn: 'Electrical',
        description: 'ელექტრო სისტემის შეკეთება და მოვლა',
        icon: 'flash',
        color: '#F59E0B',
        image:
          'https://images.unsplash.com/photo-1581094271901-8022df4466b9?q=80&w=600&auto=format&fit=crop',
        isActive: true,
        order: 3,
        serviceTypes: ['electrical', 'battery', 'alternator'],
      },
      {
        name: 'ფერის სამუშაოები',
        nameEn: 'Painting',
        description: 'მანქანის ფერის სამუშაოები და პოლირება',
        icon: 'brush',
        color: '#EF4444',
        image:
          'https://images.unsplash.com/photo-1510414696678-2415ad8474aa?q=80&w=600&auto=format&fit=crop',
        isActive: true,
        order: 4,
        serviceTypes: ['painting', 'polishing', 'bodywork'],
      },
      {
        name: 'ძრავის შეკეთება',
        nameEn: 'Engine Repair',
        description: 'ძრავის შეკეთება და მოვლა',
        icon: 'construct',
        color: '#8B5CF6',
        image:
          'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=600&auto=format&fit=crop',
        isActive: true,
        order: 5,
        serviceTypes: ['engine', 'transmission', 'repair'],
      },
      {
        name: 'საბურავები',
        nameEn: 'Tires',
        description: 'საბურავების შეცვლა და მოვლა',
        icon: 'disc',
        color: '#06B6D4',
        image:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop',
        isActive: true,
        order: 6,
        serviceTypes: ['tires', 'wheels', 'alignment'],
      },
    ];

    for (const category of categories) {
      await this.categoriesService.create(
        category as Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
      );
    }

    return {
      message: 'Basic categories seeded successfully!',
      count: categories.length,
    };
  }
}
