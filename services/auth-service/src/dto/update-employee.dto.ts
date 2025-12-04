import {
  IsString,
  MaxLength,
  IsOptional,
  IsIn,
  IsEmail,
  Matches,
  IsUrl,
} from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +1234567890)',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Photo URL must be a valid URL' })
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['employee', 'admin', 'manager'])
  role?: string;
}
