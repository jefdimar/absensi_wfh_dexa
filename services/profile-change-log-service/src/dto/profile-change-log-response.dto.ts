export class ProfileChangeLogResponseDto {
  id: string;
  employeeId: string;
  changedField: string;
  oldValue: string;
  newValue: string;
  changedAt: Date;
}
