import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsIn,
  IsBoolean,
  Matches,
} from 'class-validator';

export class CreatePartDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsIn(['ახალი', 'ძალიან კარგი', 'კარგი', 'დამაკმაყოფილებელი'])
  condition: 'ახალი' | 'ძალიან კარგი' | 'კარგი' | 'დამაკმაყოფილებელი';

  @IsString()
  @IsNotEmpty()
  price: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsString()
  @IsNotEmpty()
  seller: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+995|995)?[0-9]{9}$/, {
    message: 'ტელეფონის ნომერი უნდა იყოს ქართული ფორმატით (+995XXXXXXXXX)',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  // Optional contact info (not sent from frontend currently)
  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  // Car details - now required
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsNumber()
  year: number;

  // Additional optional fields
  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsOptional()
  @IsString()
  warranty?: string;

  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;
}
