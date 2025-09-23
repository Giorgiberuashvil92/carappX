/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FirebaseService } from '../firebase/firebase.service';
import {
  CarwashLocation,
  CarwashLocationDocument,
  CarwashService as CarwashServiceEntity,
  TimeSlotsConfig,
  DaySlots,
  TimeSlot,
  RealTimeStatus,
} from './schemas/carwash-location.schema';
import { CreateCarwashBookingDto } from './dto/create-carwash-booking.dto';
import { UpdateCarwashBookingDto } from './dto/update-carwash-booking.dto';
import { CreateCarwashLocationDto } from './dto/create-carwash-location.dto';
import { UpdateCarwashLocationDto } from './dto/update-carwash-location.dto';
import { Store } from '../stores/entities/store.entity';

type CarwashBookingEntity = CreateCarwashBookingDto & {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
};

@Injectable()
export class CarwashService {
  private popularLocationsCache: {
    data: CarwashLocation[];
    timestamp: number;
  } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 წუთი

  constructor(
    private readonly firebase: FirebaseService,
    @InjectModel(CarwashLocation.name)
    private carwashModel: Model<CarwashLocationDocument>,
  ) {}

  private col() {
    return this.firebase.db.collection('carwash_bookings');
  }

  // MongoDB-ისთვის აღარ გვჭირდება
  // private locationsCol() {
  //   return this.firebase.db.collection('carwash_locations');
  // }

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
    // MongoDB-ში შექმნა
    const createdLocation = new this.carwashModel(entity);
    await createdLocation.save();
    return createdLocation.toObject();
  }

  async findAllLocations(): Promise<CarwashLocation[]> {
    try {
      return await this.carwashModel.find().sort({ createdAt: -1 }).exec();
    } catch (error) {
      console.error('Error fetching all locations:', error);
      return [];
    }
  }

  private calculatePopularityScore(location: CarwashLocation): number {
    let score = 0;

    // 1. რეიტინგი (40% წონა)
    const ratingWeight = 0.4;
    score += (location.rating / 5) * 100 * ratingWeight;

    // 2. რევიუების რაოდენობა (25% წონა)
    const reviewsWeight = 0.25;
    const reviewsScore = Math.min(location.reviews / 100, 1); // max 100 reviews = 100%
    score += reviewsScore * 100 * reviewsWeight;

    // 3. ღიაა თუ არა (15% წონა)
    const openWeight = 0.15;
    if (location.realTimeStatus?.isOpen || location.isOpen) {
      score += 100 * openWeight;
    }

    // 4. ფასის კონკურენტუნარიანობა (10% წონა)
    const priceWeight = 0.1;
    const avgPrice = 50; // საშუალო ფასი
    const priceScore = Math.max(
      0,
      1 - Math.abs(location.price - avgPrice) / avgPrice,
    );
    score += priceScore * 100 * priceWeight;

    // 5. სერვისების რაოდენობა (10% წონა)
    const servicesWeight = 0.1;
    const servicesCount = location.detailedServices?.length || 0;
    const servicesScore = Math.min(servicesCount / 10, 1); // max 10 services = 100%
    score += servicesScore * 100 * servicesWeight;

    return Math.round(score * 100) / 100; // 2 ათობითი ნიშანი
  }

  async findLocationById(id: string): Promise<CarwashLocation | null> {
    return await this.carwashModel.findOne({ id }).exec();
  }

  async findLocationsByOwner(ownerId: string): Promise<CarwashLocation[]> {
    return await this.carwashModel
      .find({ ownerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateLocation(
    id: string,
    updateLocationDto: UpdateCarwashLocationDto,
  ): Promise<CarwashLocation | null> {
    const updateData = {
      ...updateLocationDto,
      updatedAt: Date.now(),
    };

    return await this.carwashModel
      .findOneAndUpdate({ id }, updateData, { new: true })
      .exec();
  }

  async deleteLocation(id: string): Promise<boolean> {
    const result = await this.carwashModel.deleteOne({ id }).exec();
    return result.deletedCount > 0;
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

  // პოპულარული ლოკაციების მიღება - ოპტიმიზირებული + კეშირება
  async getPopularLocations(limit: number = 10): Promise<CarwashLocation[]> {
    // კეშირებული მონაცემების შემოწმება
    if (
      this.popularLocationsCache &&
      Date.now() - this.popularLocationsCache.timestamp < this.CACHE_DURATION
    ) {
      console.log('📦 Returning cached popular locations');
      return this.popularLocationsCache.data.slice(0, limit);
    }

    console.log('🔄 Fetching fresh popular locations from database');
    // MongoDB query - ბევრად უფრო სწრაფი!
    const locations = await this.carwashModel
      .find({
        isOpen: true,
        rating: { $gte: 4.0 },
      })
      .sort({ rating: -1, reviews: -1 })
      .limit(limit * 2)
      .exec();

    // პოპულარობის ალგორითმი:
    // 1. რეიტინგი (40%) - მაღალი რეიტინგი = პოპულარული
    // 2. რევიუების რაოდენობა (25%) - მეტი რევიუ = უფრო პოპულარული
    // 3. ღიაა თუ არა (15%) - ღია სერვისები პრიორიტეტულია
    // 4. ფასის კონკურენტუნარიანობა (10%) - საშუალო ფასის მახლობლად
    // 5. სერვისების რაოდენობა (10%) - მეტი სერვისი = უკეთესი

    const scoredLocations = locations.map((location) => {
      const ratingScore = location.rating * 40; // 0-40 ქულა
      const reviewsScore = Math.min(location.reviews * 0.5, 25); // 0-25 ქულა
      const openScore = location.realTimeStatus?.isOpen ? 15 : 0; // 0-15 ქულა
      const priceScore = Math.max(0, 10 - Math.abs(location.price - 30) * 0.2); // 0-10 ქულა (საშუალო ფასი 30₾)
      const servicesScore = Math.min(
        location.detailedServices?.length || 0 * 2,
        10,
      ); // 0-10 ქულა

      const totalScore =
        ratingScore + reviewsScore + openScore + priceScore + servicesScore;

      return {
        ...location,
        popularityScore: totalScore,
      };
    });

    // დახარისხება პოპულარობის მიხედვით
    scoredLocations.sort((a, b) => b.popularityScore - a.popularityScore);

    const result = scoredLocations.slice(0, limit);

    // კეშირება
    this.popularLocationsCache = {
      data: scoredLocations,
      timestamp: Date.now(),
    };

    return result;
  }

  // ახლოს მყოფი ლოკაციების მიღება - ოპტიმიზირებული

  // ყველა ტიპის ახლოს მყოფი სერვისების მიღება (carwash + stores) - ოპტიმიზირებული
  async getAllNearbyServices(
    userLat: number,
    userLon: number,
    radiusKm: number = 10,
  ): Promise<any[]> {
    const startTime = Date.now();
    try {
      console.log('🚀 Starting parallel fetch for nearby services...');

      // პარალელური შეკითხვები - ორივე ერთდროულად
      const [carwashLocations, storeLocations] = await Promise.all([
        this.getNearbyLocations(userLat, userLon, radiusKm),
        this.getNearbyStores(userLat, userLon, radiusKm),
      ]);

      const fetchTime = Date.now() - startTime;
      console.log(`⚡ Parallel fetch completed in ${fetchTime}ms`);

      console.log('Carwash locations found:', carwashLocations.length);
      console.log('Store locations found:', storeLocations.length);

      // ყველა სერვისის გაერთიანება და დახარისხება მანძილის მიხედვით
      console.log('Combining carwash and store locations...');
      const allServices = [
        ...carwashLocations.map((location) => ({
          ...location,
          type: 'carwash',
          category: location.category || 'სამრეცხაო',
          displayName: location.name,
          displayAddress: location.address || location.location,
          displayPrice: `${location.price}₾`,
          displayRating: location.rating,
          displayReviews: location.reviews,
          isOpen: location.realTimeStatus?.isOpen || location.isOpen,
          waitTime: location.realTimeStatus?.currentWaitTime || 0,
          distance: (location as any).distance,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        })),
        ...storeLocations.map((store) => ({
          ...store,
          type: 'store',
          category: store.type,
          displayName: store.title || store.name,
          displayAddress: store.address || store.location,
          displayPrice:
            store.type === 'ავტონაწილები' ? 'ფასები ცალ-ცალკე' : 'კონსულტაცია',
          displayRating: store.rating || 0,
          displayReviews: store.reviewCount || 0,
          isOpen: store.status === 'active',
          waitTime: 0,
          distance: store.distance,
          coordinates: store.coordinates,
        })),
      ];

      console.log('Combined services before sorting:', allServices.length);
      // დახარისხება მანძილის მიხედვით
      allServices.sort((a, b) => a.distance - b.distance);

      const totalTime = Date.now() - startTime;
      console.log('Total combined services:', allServices.length);
      console.log(
        `✅ getAllNearbyServices: Returning ${allServices.length} services in ${totalTime}ms`,
      );
      return allServices;
    } catch (error) {
      console.error('Error fetching all nearby services:', error);
      console.log('Service: Returning empty array due to error');
      return [];
    }
  }

  // ახლოს მყოფი stores-ების მიღება - ოპტიმიზირებული
  private async getNearbyStores(
    userLat: number,
    userLon: number,
    radiusKm: number = 10,
  ): Promise<any[]> {
    try {
      const storesCol = this.firebase.db.collection('stores');
      console.log('Fetching stores from collection...');
      const snap = await storesCol
        .where('status', '==', 'active')
        .where('coordinates.latitude', '!=', null)
        .where('coordinates.longitude', '!=', null)
        .limit(30) // ლიმიტი რომ ნაკლები მონაცემი გადავიტანოთ
        .get();

      const stores = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Store & { id: string },
      );

      console.log('Total stores found:', stores.length);

      // Haversine ფორმულა მანძილის გამოსათვლელად
      const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
      ): number => {
        const R = 6371; // დედამიწის რადიუსი კილომეტრებში
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // ფილტრაცია რადიუსის მიხედვით და მანძილის გამოთვლა
      const nearbyStores = stores
        .filter(
          (store) =>
            store.coordinates?.latitude &&
            store.coordinates?.longitude &&
            calculateDistance(
              userLat,
              userLon,
              store.coordinates.latitude,
              store.coordinates.longitude,
            ) <= radiusKm,
        )
        .map((store) => ({
          ...store,
          distance: calculateDistance(
            userLat,
            userLon,
            store.coordinates.latitude,
            store.coordinates.longitude,
          ),
        }))
        .sort((a, b) => a.distance - b.distance);

      console.log('Nearby stores after filtering:', nearbyStores.length);
      console.log('getNearbyStores: Returning', nearbyStores.length, 'stores');
      return nearbyStores;
    } catch (error) {
      console.error('Error fetching nearby stores:', error);
      console.log('getNearbyStores: Returning empty array due to error');
      return [];
    }
  }
}
