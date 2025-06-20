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
import { Employee } from '../entities/employee.entity';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { UpdateProfileDto } from '../dto/auth/update-profile.dto';
import {
  AuthResponseDto,
  LoginResponseDto,
} from '../dto/auth/auth-response.dto';
import { ProfileChangeLogService } from './profile-change-log.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly jwtService: JwtService,
    private readonly profileChangeLogService: ProfileChangeLogService,
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

    const payload = { sub: employee.id, email: employee.email };
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

    // Log profile changes BEFORE updating
    for (const [field, newValue] of Object.entries(updateDto)) {
      if (newValue !== undefined && newValue !== null) {
        const currentValue = employee[field];

        // Handle different field mappings
        let actualField = field;
        if (field === 'phoneNumber') {
          actualField = 'phone_number';
        } else if (field === 'photoUrl') {
          actualField = 'photo_url';
        }

        if (currentValue !== newValue) {
          await this.profileChangeLogService.create({
            employeeId,
            changedField: field,
            oldValue: currentValue?.toString() || null,
            newValue: newValue?.toString() || null,
          });
        }
      }
    }

    // Update the employee with explicit field assignment
    if (updateDto.name !== undefined) employee.name = updateDto.name;
    if (updateDto.email !== undefined) employee.email = updateDto.email;
    if (updateDto.position !== undefined)
      employee.position = updateDto.position;
    if (updateDto.phoneNumber !== undefined)
      employee.phoneNumber = updateDto.phoneNumber;
    if (updateDto.photoUrl !== undefined)
      employee.photoUrl = updateDto.photoUrl;

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
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }
}
