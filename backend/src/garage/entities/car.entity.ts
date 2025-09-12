import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column()
  plateNumber: string;

  @Column({ nullable: true })
  imageUri: string;

  @Column({ nullable: true })
  lastService: Date;

  @Column({ nullable: true })
  nextService: Date;

  @Column({ default: 0 })
  mileage: number;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  vin: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
