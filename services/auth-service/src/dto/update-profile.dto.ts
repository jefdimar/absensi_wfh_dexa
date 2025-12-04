import { IsString, MaxLength, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

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

  // Role field removed - users cannot escalate their own privileges
  // Only admins can change roles via UpdateEmployeeDto
}
