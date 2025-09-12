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
import { CarwashService } from './carwash.service';
import { CreateCarwashBookingDto } from './dto/create-carwash-booking.dto';
import { UpdateCarwashBookingDto } from './dto/update-carwash-booking.dto';
import { CreateCarwashLocationDto } from './dto/create-carwash-location.dto';
import { UpdateCarwashLocationDto } from './dto/update-carwash-location.dto';
import { CarWashSeedData } from './seed-data';

@Controller('carwash')
export class CarwashController {
  constructor(
    private readonly carwashService: CarwashService,
    private readonly seedData: CarWashSeedData,
  ) {}

  @Post('bookings')
  createBooking(@Body() createBookingDto: CreateCarwashBookingDto) {
    return this.carwashService.createBooking(createBookingDto);
  }

  @Get('bookings')
  findAllBookings(@Query('userId') userId?: string) {
    return this.carwashService.findAllBookings(userId);
  }

  @Get('bookings/:id')
  findBookingById(@Param('id') id: string) {
    return this.carwashService.findBookingById(id);
  }

  @Patch('bookings/:id')
  updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateCarwashBookingDto,
  ) {
    return this.carwashService.updateBooking(id, updateBookingDto);
  }

  @Patch('bookings/:id/cancel')
  cancelBooking(@Param('id') id: string) {
    return this.carwashService.cancelBooking(id);
  }

  @Patch('bookings/:id/confirm')
  confirmBooking(@Param('id') id: string) {
    return this.carwashService.confirmBooking(id);
  }

  @Patch('bookings/:id/start')
  startBooking(@Param('id') id: string) {
    return this.carwashService.startBooking(id);
  }

  @Patch('bookings/:id/complete')
  completeBooking(@Param('id') id: string) {
    return this.carwashService.completeBooking(id);
  }

  @Delete('bookings/:id')
  deleteBooking(@Param('id') id: string) {
    return this.carwashService.deleteBooking(id);
  }

  @Get('locations/:locationId/bookings')
  getBookingsByLocation(@Param('locationId') locationId: string) {
    return this.carwashService.getBookingsByLocation(locationId);
  }

  @Get('bookings/date/:date')
  getBookingsByDate(@Param('date') date: string) {
    return this.carwashService.getBookingsByDate(date);
  }

  // Seed data endpoints (for development/testing)
  @Post('seed/locations')
  async seedLocations() {
    await this.seedData.seedCarWashLocations();
    return { message: 'Car wash locations seeded successfully!' };
  }

  @Post('seed/services')
  async seedServices() {
    await this.seedData.seedCarWashServices();
    return { message: 'Car wash services seeded successfully!' };
  }

  @Post('seed/bookings')
  async seedBookings() {
    await this.seedData.seedTestBookings();
    return { message: 'Test bookings seeded successfully!' };
  }

  @Post('seed/all')
  async seedAll() {
    await this.seedData.seedAllData();
    return { message: 'All car wash data seeded successfully!' };
  }

  // Carwash Locations CRUD endpoints
  @Post('locations')
  async createLocation(@Body() createLocationDto: CreateCarwashLocationDto) {
    return this.carwashService.createLocation(createLocationDto);
  }

  @Get('locations')
  async findAllLocations() {
    return this.carwashService.findAllLocations();
  }

  @Get('locations/:id')
  async findLocationById(@Param('id') id: string) {
    return this.carwashService.findLocationById(id);
  }

  @Get('locations/owner/:ownerId')
  async findLocationsByOwner(@Param('ownerId') ownerId: string) {
    return this.carwashService.findLocationsByOwner(ownerId);
  }

  @Patch('locations/:id')
  async updateLocation(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateCarwashLocationDto,
  ) {
    return this.carwashService.updateLocation(id, updateLocationDto);
  }

  @Delete('locations/:id')
  async deleteLocation(@Param('id') id: string) {
    return this.carwashService.deleteLocation(id);
  }

  // ახალი endpoints სერვისების, დროის სლოტების და რეალური დროის სტატუსისთვის

  // სერვისების მართვა
  @Get('locations/:id/services')
  async getServices(@Param('id') id: string) {
    return this.carwashService.getServices(id);
  }

  @Patch('locations/:id/services')
  async updateServices(@Param('id') id: string, @Body() services: any[]) {
    return this.carwashService.updateServices(id, services);
  }

  // დროის სლოტების მართვა
  @Patch('locations/:id/time-slots-config')
  async updateTimeSlotsConfig(
    @Param('id') id: string,
    @Body() timeSlotsConfig: any,
  ) {
    return this.carwashService.updateTimeSlotsConfig(id, timeSlotsConfig);
  }

  @Get('locations/:id/available-slots')
  async getAvailableSlots(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.carwashService.generateAvailableSlots(id, startDate, endDate);
  }

  @Post('locations/:id/available-slots')
  async updateAvailableSlots(@Param('id') id: string, @Body() daySlots: any[]) {
    return this.carwashService.updateAvailableSlots(id, daySlots);
  }

  @Post('locations/:id/book-slot')
  async bookTimeSlot(
    @Param('id') id: string,
    @Body() bookingData: { date: string; time: string; bookingId: string },
  ) {
    return this.carwashService.bookTimeSlot(
      id,
      bookingData.date,
      bookingData.time,
      bookingData.bookingId,
    );
  }

  @Post('locations/:id/release-slot')
  async releaseTimeSlot(
    @Param('id') id: string,
    @Body() slotData: { date: string; time: string },
  ) {
    return this.carwashService.releaseTimeSlot(
      id,
      slotData.date,
      slotData.time,
    );
  }

  // რეალური დროის სტატუსის მართვა
  @Get('locations/:id/status')
  async getRealTimeStatus(@Param('id') id: string) {
    return this.carwashService.getRealTimeStatus(id);
  }

  @Patch('locations/:id/status')
  async updateRealTimeStatus(@Param('id') id: string, @Body() status: any) {
    return this.carwashService.updateRealTimeStatus(id, status);
  }

  @Patch('locations/:id/toggle-open')
  async toggleOpenStatus(@Param('id') id: string) {
    return this.carwashService.toggleOpenStatus(id);
  }

  @Patch('locations/:id/wait-time')
  async updateWaitTime(
    @Param('id') id: string,
    @Body() waitData: { waitTime: number; queue: number },
  ) {
    return this.carwashService.updateWaitTime(
      id,
      waitData.waitTime,
      waitData.queue,
    );
  }
}
