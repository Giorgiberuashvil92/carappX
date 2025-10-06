import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  IsUrl,
  IsNumber,
  Matches,
  IsIn,
} from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ავტონაწილები', 'სამართ-დასახურებელი', 'რემონტი', 'სხვა'])
  type?: 'ავტონაწილები' | 'სამართ-დასახურებელი' | 'რემონტი' | 'სხვა';

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+995|995)?[0-9]{9,13}$/, {
    message: 'ტელეფონის ნომერი უნდა იყოს ქართული ფორმატით (+995XXXXXXXXX)',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  workingHours?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsArray()
  services?: string[];

  @IsOptional()
  @IsArray()
  specializations?: string[];

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  managerName?: string;

  @IsOptional()
  @IsString()
  alternativePhone?: string;

  @IsOptional()
  @IsUrl()
  facebook?: string;

  @IsOptional()
  @IsUrl()
  instagram?: string;

  @IsOptional()
  @IsUrl()
  youtube?: string;

  @IsOptional()
  @IsNumber()
  yearEstablished?: number;

  @IsOptional()
  @IsNumber()
  employeeCount?: number;

  @IsOptional()
  @IsString()
  license?: string;
}
