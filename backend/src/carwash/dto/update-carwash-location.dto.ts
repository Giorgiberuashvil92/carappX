import { PartialType } from '@nestjs/mapped-types';
import { CreateCarwashLocationDto } from './create-carwash-location.dto';

export class UpdateCarwashLocationDto extends PartialType(CreateCarwashLocationDto) {
  updatedAt: number;
}
