import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  async updateUserLocation(
    @Body() body: {
      userId: string;
      latitude: number;
      longitude: number;
      address?: string;
      city?: string;
    }
  ): Promise<{ success: boolean }> {
    await this.locationService.updateUserLocation(
      body.userId,
      body.latitude,
      body.longitude,
      body.address,
      body.city
    );
    return { success: true };
  }

  @Get('user/:userId')
  async getUserLocation(@Param('userId') userId: string) {
    return this.locationService.getUserLocation(userId);
  }

  @Get('nearby/:userId')
  async getNearbyLocations(
    @Param('userId') userId: string,
    @Query('radius') radius?: string
  ) {
    const radiusKm = radius ? parseFloat(radius) : 5;
    return this.locationService.getNearbyLocations(userId, radiusKm);
  }
}
