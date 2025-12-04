import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { Employee } from '../entities/employee.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import {
  AuthResponseDto,
  LoginResponseDto,
  PaginatedEmployeesDto,
} from '../dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingEmployee = await this.employeeRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingEmployee) {
      throw new ConflictException('Email already exists');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    const employee = this.employeeRepository.create({
      ...registerDto,
      passwordHash,
      role: registerDto.role || 'employee',
    });

    const savedEmployee = await this.employeeRepository.save(employee);
    return this.mapToAuthResponse(savedEmployee);
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const employee = await this.employeeRepository.findOne({
      where: { email: loginDto.email },
    });

    // Always perform bcrypt comparison to prevent timing attacks
    // Use a dummy hash if employee doesn't exist
    const passwordHash = employee?.passwordHash || '$2a$12$invalidhashtopreventtimingattack1234567890';
    const isValid = await bcrypt.compare(loginDto.password, passwordHash);

    if (!employee || !isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: employee.id,
      email: employee.email,
      role: employee.role,
      employeeId: employee.id,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      employee: this.mapToAuthResponse(employee),
      accessToken,
    };
  }

  async updateProfile(
    employeeId: string,
    updateDto: UpdateProfileDto,
  ): Promise<AuthResponseDto> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Log profile changes via HTTP call
    for (const [field, newValue] of Object.entries(updateDto)) {
      if (newValue !== undefined && employee[field] !== newValue) {
        try {
          const profileChangeLogUrl = this.configService.get(
            'PROFILE_CHANGE_LOG_SERVICE_URL',
            'http://profile_change_log_service:3002',
          );

          console.log(
            `Logging profile change: ${field} from "${employee[field]}" to "${newValue}"`,
          );
          console.log(`Profile Change Log Service URL: ${profileChangeLogUrl}`);

          const response = await fetch(
            `${profileChangeLogUrl}/profile-change-logs`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                employeeId,
                changedField: field,
                oldValue: employee[field]?.toString() || null,
                newValue: newValue?.toString() || null,
              }),
            },
          );

          if (!response.ok) {
            console.error(
              'Failed to log profile change:',
              response.status,
              response.statusText,
            );
            const errorText = await response.text();
            console.error('Error response:', errorText);
          } else {
            console.log('Profile change logged successfully');
          }
        } catch (error) {
          console.error('Failed to log profile change:', error.message);
          // Don't fail the update if logging fails
        }
      }
    }

    Object.assign(employee, updateDto);
    const updatedEmployee = await this.employeeRepository.save(employee);

    return this.mapToAuthResponse(updatedEmployee);
  }

  async getProfile(employeeId: string): Promise<AuthResponseDto> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.mapToAuthResponse(employee);
  }

  // New methods for employee management
  async getAllEmployees(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedEmployeesDto> {
    const skip = (page - 1) * limit;

    // Escape special characters in search to prevent SQL injection
    const escapedSearch = search ? search.replace(/[%_]/g, '\\$&') : '';

    const whereCondition = search
      ? [
          { name: ILike(`%${escapedSearch}%`) },
          { email: ILike(`%${escapedSearch}%`) },
          { position: ILike(`%${escapedSearch}%`) },
        ]
      : {};

    const [employees, total] = await this.employeeRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      employees: employees.map((emp) => this.mapToAuthResponse(emp)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateEmployee(
    employeeId: string,
    updateDto: UpdateEmployeeDto,
  ): Promise<AuthResponseDto> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if email is being updated and if it already exists
    if (updateDto.email && updateDto.email !== employee.email) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: { email: updateDto.email },
      });

      if (existingEmployee) {
        throw new ConflictException('Email already exists');
      }
    }

    // Log profile changes via HTTP call (similar to updateProfile)
    for (const [field, newValue] of Object.entries(updateDto)) {
      if (newValue !== undefined && employee[field] !== newValue) {
        try {
          const profileChangeLogUrl = this.configService.get(
            'PROFILE_CHANGE_LOG_SERVICE_URL',
            'http://profile_change_log_service:3002',
          );

          const response = await fetch(
            `${profileChangeLogUrl}/profile-change-logs`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                employeeId,
                changedField: field,
                oldValue: employee[field]?.toString() || null,
                newValue: newValue?.toString() || null,
              }),
            },
          );

          if (!response.ok) {
            console.error('Failed to log profile change:', response.status);
          }
        } catch (error) {
          console.error('Failed to log profile change:', error.message);
        }
      }
    }

    Object.assign(employee, updateDto);
    const updatedEmployee = await this.employeeRepository.save(employee);

    return this.mapToAuthResponse(updatedEmployee);
  }

  async deleteEmployee(employeeId: string): Promise<void> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.employeeRepository.remove(employee);
  }

  private mapToAuthResponse(employee: Employee): AuthResponseDto {
    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      position: employee.position,
      phoneNumber: employee.phoneNumber,
      photoUrl: employee.photoUrl,
      role: employee.role,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }
}
