import { IsString, IsOptional, IsNotEmpty, IsDateString, IsIn } from 'class-validator';

export class CreateReminderDto {
  @IsString()
  @IsNotEmpty()
  carId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsIn(['service', 'oil', 'tires', 'battery', 'insurance', 'inspection'])
  type: string;

  @IsString()
  @IsIn(['low', 'medium', 'high'])
  priority: string;

  @IsDateString()
  reminderDate: string;

  @IsOptional()
  @IsString()
  reminderTime?: string;
}
