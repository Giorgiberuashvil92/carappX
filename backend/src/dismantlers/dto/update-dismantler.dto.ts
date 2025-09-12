import { PartialType } from '@nestjs/mapped-types';
import { CreateDismantlerDto } from './create-dismantler.dto';
import { IsOptional, IsIn } from 'class-validator';

export class UpdateDismantlerDto extends PartialType(CreateDismantlerDto) {
  @IsOptional()
  @IsIn(['active', 'inactive', 'pending'])
  status?: 'active' | 'inactive' | 'pending';

  @IsOptional()
  isFeatured?: boolean;
}
