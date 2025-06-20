import { IsUUID, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateProfileChangeLogDto {
  @IsUUID()
  employeeId: string;

  @IsString()
  @MaxLength(50)
  changedField: string;

  @IsOptional()
  @IsString()
  oldValue?: string;

  @IsOptional()
  @IsString()
  newValue?: string;
}
