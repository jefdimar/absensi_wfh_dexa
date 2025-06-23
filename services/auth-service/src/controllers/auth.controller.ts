import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import {
  AuthResponseDto,
  LoginResponseDto,
  PaginatedEmployeesDto,
} from '../dto/auth-response.dto';
import { JwtAuthGuard } from '../config/guards/jwt-auth.guard';
import { AdminGuard } from '../config/guards/admin.guard';

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

  // New employee management routes (Admin only)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('employees')
  async getAllEmployees(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<PaginatedEmployeesDto> {
    return await this.authService.getAllEmployees(page, limit, search);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('employees/:id')
  async updateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEmployeeDto,
  ): Promise<AuthResponseDto> {
    return await this.authService.updateEmployee(id, updateDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('employees/:id')
  async deleteEmployee(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.authService.deleteEmployee(id);
    return { message: 'Employee deleted successfully' };
  }
}
