import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateCarwashBookingDto } from './dto/create-carwash-booking.dto';
import { UpdateCarwashBookingDto } from './dto/update-carwash-booking.dto';
import { CreateCarwashLocationDto } from './dto/create-carwash-location.dto';
import { UpdateCarwashLocationDto } from './dto/update-carwash-location.dto';
import {
  CarwashLocation,
  CarwashService as CarwashServiceEntity,
  TimeSlotsConfig,
  RealTimeStatus,
  DaySlots,
  TimeSlot,
} from './entities/carwash-location.entity';

type CarwashBookingEntity = CreateCarwashBookingDto & {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
};

@Injectable()
export class CarwashService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.db.collection('carwash_bookings');
  }

  private locationsCol() {
    return this.firebase.db.collection('carwash_locations');
  }

  async createBooking(createBookingDto: CreateCarwashBookingDto) {
    const id = `booking_${Date.now()}`;
    const entity: CarwashBookingEntity = {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending',
      ...createBookingDto,
    };
    await this.col().doc(id).set(entity);
    return entity;
  }

  async findAllBookings(userId?: string) {
    if (userId) {
      const snap = await this.col().where('userId', '==', userId).get();
      return snap.docs
        .map((d) => d.data() as CarwashBookingEntity)
        .sort((a, b) => b.createdAt - a.createdAt);
    } else {
      const snap = await this.col().orderBy('createdAt', 'desc').get();
      return snap.docs.map((d) => d.data() as CarwashBookingEntity);
    }
  }

  async findBookingById(id: string) {
    const doc = await this.col().doc(id).get();
    return doc.exists ? (doc.data() as CarwashBookingEntity) : null;
  }

  async updateBooking(id: string, updateBookingDto: UpdateCarwashBookingDto) {
    const docRef = this.col().doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const updateData = {
      ...updateBookingDto,
      updatedAt: Date.now(),
    };

    await docRef.update(updateData);
    const merged = {
      ...(doc.data() as CarwashBookingEntity),
      ...updateData,
    } as CarwashBookingEntity;
    return merged;
  }

  async cancelBooking(id: string) {
    return this.updateBooking(id, { status: 'cancelled' });
  }

  async confirmBooking(id: string) {
    return this.updateBooking(id, { status: 'confirmed' });
  }

  async startBooking(id: string) {
    return this.updateBooking(id, { status: 'in_progress' });
  }

  async completeBooking(id: string) {
    return this.updateBooking(id, { status: 'completed' });
  }

  async deleteBooking(id: string) {
    const docRef = this.col().doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  }

  async getBookingsByLocation(locationId: string) {
    const snap = await this.col().where('locationId', '==', locationId).get();
    return snap.docs
      .map((d) => d.data() as CarwashBookingEntity)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getBookingsByDate(date: string) {
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);

    const snap = await this.col()
      .where('bookingDate', '>=', startOfDay)
      .where('bookingDate', '<=', endOfDay)
      .get();
    return snap.docs
      .map((d) => d.data() as CarwashBookingEntity)
      .sort((a, b) => a.bookingDate - b.bookingDate);
  }

  // Carwash Locations CRUD operations
  async createLocation(
    createLocationDto: CreateCarwashLocationDto,
  ): Promise<CarwashLocation> {
    const id = `location_${Date.now()}`;
    const entity: CarwashLocation = {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      availableSlots: [], // დეფოლტი ცარიელი სლოტები
      detailedServices: [], // დეფოლტი ცარიელი სერვისები
      timeSlotsConfig: {
        workingDays: [],
        interval: 30,
        breakTimes: [],
      },
      realTimeStatus: {
        isOpen: true,
        currentWaitTime: 10,
        currentQueue: 0,
        estimatedWaitTime: 10,
        lastStatusUpdate: Date.now(),
      },
      ...createLocationDto,
    };
    await this.locationsCol().doc(id).set(entity);
    return entity;
  }

  async findAllLocations(): Promise<CarwashLocation[]> {
    const snap = await this.locationsCol().orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => d.data() as CarwashLocation);
  }

  async findLocationById(id: string): Promise<CarwashLocation | null> {
    const doc = await this.locationsCol().doc(id).get();
    return doc.exists ? (doc.data() as CarwashLocation) : null;
  }

  async findLocationsByOwner(ownerId: string): Promise<CarwashLocation[]> {
    const snap = await this.locationsCol()
      .where('ownerId', '==', ownerId)
      .get();

    // Sort in memory instead of using orderBy to avoid index requirement
    const locations = snap.docs.map((d) => d.data() as CarwashLocation);
    return locations.sort((a, b) => b.createdAt - a.createdAt);
  }

  async updateLocation(
    id: string,
    updateLocationDto: UpdateCarwashLocationDto,
  ): Promise<CarwashLocation | null> {
    const docRef = this.locationsCol().doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const updateData = {
      ...updateLocationDto,
      updatedAt: Date.now(),
    };

    await docRef.update(updateData);
    const merged = {
      ...(doc.data() as CarwashLocation),
      ...updateData,
    } as CarwashLocation;
    return merged;
  }

  async deleteLocation(id: string): Promise<boolean> {
    const docRef = this.locationsCol().doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  }

  // ახალი მეთოდები სერვისების, დროის სლოტების და რეალური დროის სტატუსისთვის

  // სერვისების მართვა
  async updateServices(
    locationId: string,
    services: CarwashServiceEntity[],
  ): Promise<CarwashLocation | null> {
    return this.updateLocation(locationId, {
      detailedServices: services,
      updatedAt: Date.now(),
    });
  }

  async getServices(locationId: string): Promise<CarwashServiceEntity[]> {
    const location = await this.findLocationById(locationId);
    return location?.detailedServices || [];
  }

  // დროის სლოტების მართვა
  async updateTimeSlotsConfig(
    locationId: string,
    timeSlotsConfig: TimeSlotsConfig,
  ): Promise<CarwashLocation | null> {
    return this.updateLocation(locationId, {
      timeSlotsConfig,
      updatedAt: Date.now(),
    });
  }

  async generateAvailableSlots(
    locationId: string,
    startDate: string,
    endDate: string,
  ): Promise<DaySlots[]> {
    const location = await this.findLocationById(locationId);
    if (!location?.timeSlotsConfig) return [];

    const slots: DaySlots[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dayName = date
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
      const workingDay = location.timeSlotsConfig.workingDays.find(
        (wd) => wd.day === dayName,
      );

      if (!workingDay?.isWorking) continue;

      const daySlots: TimeSlot[] = [];
      const startTime = new Date(date);
      const [startHour, startMin] = workingDay.startTime.split(':').map(Number);
      startTime.setHours(startHour, startMin, 0, 0);

      const endTime = new Date(date);
      const [endHour, endMin] = workingDay.endTime.split(':').map(Number);
      endTime.setHours(endHour, endMin, 0, 0);

      for (
        let time = new Date(startTime);
        time < endTime;
        time.setMinutes(time.getMinutes() + location.timeSlotsConfig.interval)
      ) {
        const timeString = time.toTimeString().slice(0, 5);

        // შეამოწმებს არის თუ არა შესვენების დროს
        const isBreakTime = location.timeSlotsConfig.breakTimes.some(
          (bt) => timeString >= bt.start && timeString < bt.end,
        );

        if (!isBreakTime) {
          daySlots.push({
            time: timeString,
            available: true,
          });
        }
      }

      slots.push({
        date: date.toISOString().split('T')[0],
        slots: daySlots,
      });
    }

    return slots;
  }

  async updateAvailableSlots(
    locationId: string,
    daySlots: DaySlots[],
  ): Promise<CarwashLocation | null> {
    return this.updateLocation(locationId, {
      availableSlots: daySlots,
      updatedAt: Date.now(),
    } as any);
  }

  async bookTimeSlot(
    locationId: string,
    date: string,
    time: string,
    bookingId: string,
  ): Promise<boolean> {
    const location = await this.findLocationById(locationId);
    if (!location?.availableSlots) return false;

    const daySlots = location.availableSlots.find((ds) => ds.date === date);
    if (!daySlots) return false;

    const slot = daySlots.slots.find((s) => s.time === time);
    if (!slot || !slot.available) return false;

    slot.available = false;
    slot.bookedBy = bookingId;

    await this.updateAvailableSlots(locationId, location.availableSlots);
    return true;
  }

  async releaseTimeSlot(
    locationId: string,
    date: string,
    time: string,
  ): Promise<boolean> {
    const location = await this.findLocationById(locationId);
    if (!location?.availableSlots) return false;

    const daySlots = location.availableSlots.find((ds) => ds.date === date);
    if (!daySlots) return false;

    const slot = daySlots.slots.find((s) => s.time === time);
    if (!slot) return false;

    slot.available = true;
    slot.bookedBy = undefined;

    await this.updateAvailableSlots(locationId, location.availableSlots);
    return true;
  }

  // რეალური დროის სტატუსის მართვა
  async updateRealTimeStatus(
    locationId: string,
    status: Partial<RealTimeStatus>,
  ): Promise<CarwashLocation | null> {
    const location = await this.findLocationById(locationId);
    if (!location) return null;

    const updatedStatus: RealTimeStatus = {
      ...location.realTimeStatus,
      ...status,
      lastStatusUpdate: Date.now(),
    };

    return this.updateLocation(locationId, {
      realTimeStatus: updatedStatus,
      updatedAt: Date.now(),
    });
  }

  async getRealTimeStatus(locationId: string): Promise<RealTimeStatus | null> {
    const location = await this.findLocationById(locationId);
    return location?.realTimeStatus || null;
  }

  async toggleOpenStatus(locationId: string): Promise<CarwashLocation | null> {
    const location = await this.findLocationById(locationId);
    if (!location?.realTimeStatus) return null;

    const newStatus = !location.realTimeStatus.isOpen;
    return this.updateRealTimeStatus(locationId, { isOpen: newStatus });
  }

  async updateWaitTime(
    locationId: string,
    waitTime: number,
    queue: number,
  ): Promise<CarwashLocation | null> {
    return this.updateRealTimeStatus(locationId, {
      currentWaitTime: waitTime,
      currentQueue: queue,
      estimatedWaitTime: waitTime + queue * 15, // ვარაუდით 15 წუთი ყოველ ჯავშნაზე
    });
  }
}
