import { IsUUID, IsString, MaxLength, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateProfileChangeLogDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  changedField: string;

  @IsOptional()
  @IsString()
  oldValue?: string;

  @IsOptional()
  @IsString()
  newValue?: string;
}
