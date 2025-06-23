import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { Employee } from '../entities/employee.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { AuthResponseDto, LoginResponseDto } from '../dto/auth-response.dto';

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
      role: registerDto.role || 'employee', // Default to 'employee' if not provided
    });

    const savedEmployee = await this.employeeRepository.save(employee);
    return this.mapToAuthResponse(savedEmployee);
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const employee = await this.employeeRepository.findOne({
      where: { email: loginDto.email },
    });

    if (
      !employee ||
      !(await bcrypt.compare(loginDto.password, employee.passwordHash))
    ) {
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
