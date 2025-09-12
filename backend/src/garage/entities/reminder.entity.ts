import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Car } from './car.entity';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  carId: string;

  @ManyToOne(() => Car)
  @JoinColumn({ name: 'carId' })
  car: Car;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  type: string; // service, oil, tires, battery, insurance, inspection

  @Column()
  priority: string; // low, medium, high

  @Column()
  reminderDate: Date;

  @Column({ nullable: true })
  reminderTime: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
