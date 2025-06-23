import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsIn,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
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
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['employee', 'admin'])
  role?: string;
}
