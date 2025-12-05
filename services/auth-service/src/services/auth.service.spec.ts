import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { Employee } from '../entities/employee.entity';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let employeeRepository: Repository<Employee>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockEmployee = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: '$2a$12$hashedpassword',
    role: 'employee',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEmployeeRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeeRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    employeeRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
    };

    it('should successfully register a new employee', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);
      mockEmployeeRepository.create.mockReturnValue(mockEmployee);
      mockEmployeeRepository.save.mockResolvedValue(mockEmployee);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        employee: expect.objectContaining({
          id: mockEmployee.id,
          email: mockEmployee.email,
        }),
        accessToken: 'jwt-token',
      });
      expect(mockEmployeeRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockEmployeeRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockEmployeeRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'john@example.com',
      password: 'Password123!',
    };

    it('should successfully login with valid credentials', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        employee: expect.objectContaining({
          id: mockEmployee.id,
          email: mockEmployee.email,
        }),
        accessToken: 'jwt-token',
      });
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with non-existent email', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findById', () => {
    it('should return employee by id', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);

      const result = await service.findById(mockEmployee.id);

      expect(result).toEqual(mockEmployee);
      expect(mockEmployeeRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEmployee.id },
      });
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all employees', async () => {
      const employees = [mockEmployee];
      mockEmployeeRepository.find.mockResolvedValue(employees);

      const result = await service.findAll();

      expect(result).toEqual(employees);
      expect(mockEmployeeRepository.find).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      name: 'Jane Doe',
      position: 'Senior Developer',
    };

    it('should successfully update employee profile', async () => {
      const updatedEmployee = { ...mockEmployee, ...updateDto };
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockEmployeeRepository.save.mockResolvedValue(updatedEmployee);
      mockConfigService.get.mockReturnValue('http://profile_change_log_service:3002');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      ) as jest.Mock;

      const result = await service.updateProfile(mockEmployee.id, updateDto);

      expect(result).toEqual(updatedEmployee);
      expect(mockEmployeeRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('non-existent-id', updateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteEmployee', () => {
    it('should successfully delete employee', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockEmployeeRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteEmployee(mockEmployee.id);

      expect(mockEmployeeRepository.delete).toHaveBeenCalledWith(mockEmployee.id);
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteEmployee('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
