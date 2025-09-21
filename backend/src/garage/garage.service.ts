/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { CreateFuelEntryDto } from './dto/create-fuel-entry.dto';

type CarEntity = CreateCarDto & {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
};

type ReminderEntity = Omit<CreateReminderDto, 'reminderDate'> & {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  isCompleted: boolean;
  isUrgent: boolean;
  isActive: boolean;
  reminderDate: number; // timestamp
};

type FuelEntryEntity = CreateFuelEntryDto & {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  dateTs: number;
};

@Injectable()
export class GarageService {
  constructor(private readonly firebase: FirebaseService) {}

  private carsCol() {
    return this.firebase.db.collection('cars');
  }

  private remindersCol() {
    return this.firebase.db.collection('reminders');
  }

  private fuelCol() {
    return this.firebase.db.collection('fuel_entries');
  }

  // მანქანების მართვა
  async createCar(
    userId: string,
    createCarDto: CreateCarDto,
  ): Promise<CarEntity> {
    const id = `car_${Date.now()}`;
    const entity: CarEntity = {
      id,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      ...createCarDto,
    };

    await this.carsCol().doc(id).set(entity);
    return entity;
  }

  async findAllCars(userId: string): Promise<CarEntity[]> {
    const snap = await this.carsCol().where('userId', '==', userId).get();

    return snap.docs
      .map((d) => d.data() as CarEntity)
      .filter((car) => car.isActive)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async findOneCar(userId: string, id: string): Promise<CarEntity> {
    const doc = await this.carsCol().doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('მანქანა ვერ მოიძებნა');
    }

    const car = doc.data() as CarEntity;

    if (car.userId !== userId || !car.isActive) {
      throw new NotFoundException('მანქანა ვერ მოიძებნა');
    }

    return car;
  }

  async updateCar(
    userId: string,
    id: string,
    updateCarDto: UpdateCarDto,
  ): Promise<CarEntity> {
    const car = await this.findOneCar(userId, id);

    const updateData = {
      ...updateCarDto,
      updatedAt: Date.now(),
    };

    await this.carsCol().doc(id).update(updateData);

    return {
      ...car,
      ...updateData,
    } as CarEntity;
  }

  async removeCar(userId: string, id: string): Promise<void> {
    await this.findOneCar(userId, id);

    await this.carsCol().doc(id).update({
      isActive: false,
      updatedAt: Date.now(),
    });
  }

  // შეხსენებების მართვა
  async createReminder(
    userId: string,
    createReminderDto: CreateReminderDto,
  ): Promise<ReminderEntity> {
    // შევამოწმოთ რომ მანქანა არსებობს
    await this.findOneCar(userId, createReminderDto.carId);

    const id = `reminder_${Date.now()}`;
    const reminderDate = new Date(createReminderDto.reminderDate).getTime();

    const entity: ReminderEntity = {
      id,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCompleted: false,
      isUrgent: this.isUrgentReminder(new Date(reminderDate)),
      isActive: true,
      reminderDate,
      carId: createReminderDto.carId,
      title: createReminderDto.title,
      description: createReminderDto.description || '',
      type: createReminderDto.type,
      priority: createReminderDto.priority,
      reminderTime: createReminderDto.reminderTime || '',
    };

    await this.remindersCol().doc(id).set(entity);
    return entity;
  }

  async findAllReminders(userId: string): Promise<ReminderEntity[]> {
    const snap = await this.remindersCol().where('userId', '==', userId).get();

    return snap.docs
      .map((d) => d.data() as ReminderEntity)
      .filter((reminder) => reminder.isActive)
      .sort((a, b) => a.reminderDate - b.reminderDate);
  }

  async findRemindersByCar(
    userId: string,
    carId: string,
  ): Promise<ReminderEntity[]> {
    const snap = await this.remindersCol()
      .where('userId', '==', userId)
      .where('carId', '==', carId)
      .get();

    return snap.docs
      .map((d) => d.data() as ReminderEntity)
      .filter((reminder) => reminder.isActive)
      .sort((a, b) => a.reminderDate - b.reminderDate);
  }

  async findOneReminder(userId: string, id: string): Promise<ReminderEntity> {
    const doc = await this.remindersCol().doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('შეხსენება ვერ მოიძებნა');
    }

    const reminder = doc.data() as ReminderEntity;

    if (reminder.userId !== userId || !reminder.isActive) {
      throw new NotFoundException('შეხსენება ვერ მოიძებნა');
    }

    return reminder;
  }

  async updateReminder(
    userId: string,
    id: string,
    updateReminderDto: UpdateReminderDto,
  ): Promise<ReminderEntity> {
    const reminder = await this.findOneReminder(userId, id);

    const updateData: any = {
      updatedAt: Date.now(),
    };

    // ვამატებ ყველა ველს ცალ-ცალკე
    if (updateReminderDto.carId !== undefined) {
      updateData.carId = updateReminderDto.carId;
    }
    if (updateReminderDto.title !== undefined) {
      updateData.title = updateReminderDto.title;
    }
    if (updateReminderDto.description !== undefined) {
      updateData.description = updateReminderDto.description;
    }
    if (updateReminderDto.type !== undefined) {
      updateData.type = updateReminderDto.type;
    }
    if (updateReminderDto.priority !== undefined) {
      updateData.priority = updateReminderDto.priority;
    }
    if (updateReminderDto.reminderTime !== undefined) {
      updateData.reminderTime = updateReminderDto.reminderTime;
    }

    if (updateReminderDto.reminderDate) {
      const reminderDate = new Date(updateReminderDto.reminderDate).getTime();
      updateData.reminderDate = reminderDate;
      updateData.isUrgent = this.isUrgentReminder(new Date(reminderDate));
    }

    await this.remindersCol().doc(id).update(updateData);

    return {
      ...reminder,
      ...updateData,
    } as ReminderEntity;
  }

  async removeReminder(userId: string, id: string): Promise<void> {
    await this.findOneReminder(userId, id);

    await this.remindersCol().doc(id).update({
      isActive: false,
      updatedAt: Date.now(),
    });
  }

  async markReminderCompleted(
    userId: string,
    id: string,
  ): Promise<ReminderEntity> {
    const reminder = await this.findOneReminder(userId, id);

    const updateData = {
      isCompleted: true,
      updatedAt: Date.now(),
    };

    await this.remindersCol().doc(id).update(updateData);

    return {
      ...reminder,
      ...updateData,
    } as ReminderEntity;
  }

  // დამხმარე მეთოდები
  private isUrgentReminder(date: Date): boolean {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // 7 დღე ან ნაკლები
  }

  // სტატისტიკა
  async getGarageStats(userId: string) {
    const cars = await this.findAllCars(userId);
    const reminders = await this.findAllReminders(userId);

    const urgentReminders = reminders.filter(
      (r) => r.isUrgent && !r.isCompleted,
    );
    const upcomingReminders = reminders.filter((r) => {
      const diffTime = r.reminderDate - Date.now();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && !r.isCompleted;
    });

    return {
      totalCars: cars.length,
      totalReminders: reminders.length,
      urgentReminders: urgentReminders.length,
      upcomingReminders: upcomingReminders.length,
      completedReminders: reminders.filter((r) => r.isCompleted).length,
    };
  }

  // საწვავი
  async createFuelEntry(
    userId: string,
    dto: CreateFuelEntryDto,
  ): Promise<FuelEntryEntity> {
    await this.findOneCar(userId, dto.carId);
    const id = `fuel_${Date.now()}`;
    const dateTs = new Date(dto.date).getTime();
    const entity: FuelEntryEntity = {
      id,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      dateTs,
      ...dto,
    };
    await this.fuelCol().doc(id).set(entity);
    return entity;
  }

  async listFuelEntries(userId: string): Promise<FuelEntryEntity[]> {
    const snap = await this.fuelCol().where('userId', '==', userId).get();
    return snap.docs
      .map((d) => d.data() as FuelEntryEntity)
      .filter((e) => e.isActive)
      .sort((a, b) => b.dateTs - a.dateTs);
  }

  async listFuelEntriesByCar(
    userId: string,
    carId: string,
  ): Promise<FuelEntryEntity[]> {
    await this.findOneCar(userId, carId);
    const snap = await this.fuelCol()
      .where('userId', '==', userId)
      .where('carId', '==', carId)
      .get();
    return snap.docs
      .map((d) => d.data() as FuelEntryEntity)
      .filter((e) => e.isActive)
      .sort((a, b) => b.dateTs - a.dateTs);
  }
}
