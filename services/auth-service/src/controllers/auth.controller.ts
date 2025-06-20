import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import {
  AuthResponseDto,
  LoginResponseDto,
} from '../dto/auth-response.dto';
import { JwtAuthGuard } from '../config/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return await this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req): Promise<AuthResponseDto> {
    return await this.authService.getProfile(req.user.employeeId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<AuthResponseDto> {
    return await this.authService.updateProfile(req.user.employeeId, updateDto);
  }
}
