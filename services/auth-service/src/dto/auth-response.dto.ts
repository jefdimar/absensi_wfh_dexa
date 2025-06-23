export class AuthResponseDto {
  id: string;
  name: string;
  email: string;
  position: string;
  phoneNumber: string;
  photoUrl: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LoginResponseDto {
  employee: AuthResponseDto;
  accessToken: string;
}

export class PaginatedEmployeesDto {
  employees: AuthResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
