import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsIn,
  IsNotEmpty,
  IsUrl,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

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
  @IsIn(['employee', 'admin'])
  role?: string;
}
