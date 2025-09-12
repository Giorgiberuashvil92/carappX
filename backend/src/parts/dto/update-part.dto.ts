import { PartialType } from '@nestjs/mapped-types';
import { CreatePartDto } from './create-part.dto';
import { IsOptional, IsIn } from 'class-validator';

export class UpdatePartDto extends PartialType(CreatePartDto) {
  @IsOptional()
  @IsIn(['active', 'inactive', 'sold', 'pending'])
  status?: 'active' | 'inactive' | 'sold' | 'pending';

  @IsOptional()
  isFeatured?: boolean;
}
