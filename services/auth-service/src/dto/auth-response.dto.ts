export class AuthResponseDto {
  id: string;
  name: string;
  email: string;
  position: string;
  phoneNumber: string;
  photoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LoginResponseDto {
  employee: AuthResponseDto;
  accessToken: string;
}
