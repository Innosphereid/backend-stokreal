import { UserService } from '../../services/UserService';
import { UserModel } from '../../models/UserModel';
import { PasswordUtils } from '../../utils/password';
import { User, CreateUserRequest, UpdateUserRequest, QueryParams } from '../../types';

// Mock dependencies
jest.mock('../../models/UserModel');
jest.mock('../../utils/password');

const mockUserModel = UserModel as jest.MockedClass<typeof UserModel>;
const mockPasswordUtils = PasswordUtils as jest.Mocked<typeof PasswordUtils>;

describe('UserService', () => {
  let userService: UserService;
  let mockUser: User;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();

    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      password_hash: 'hashed-password',
      full_name: 'Test User',
      phone: '+628123456789',
      whatsapp_number: '+628123456789',
      subscription_plan: 'free',
      subscription_expires_at: undefined,
      is_active: true,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  describe('getUsers', () => {
    it('should return paginated users successfully', async () => {
      const queryParams: QueryParams = { page: 1, limit: 10 };
      const mockUsers = [mockUser];
      const mockTotal = 1;

      mockUserModel.prototype.findAll.mockResolvedValue({
        data: mockUsers,
        total: mockTotal,
      });

      const result = await userService.getUsers(queryParams);

      expect(result.data).toEqual(mockUsers);
      expect(result.meta.total).toBe(mockTotal);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(mockUserModel.prototype.findAll).toHaveBeenCalledWith(queryParams);
    });

    it('should handle empty results', async () => {
      const queryParams: QueryParams = { page: 1, limit: 10 };

      mockUserModel.prototype.findAll.mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await userService.getUsers(queryParams);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID successfully', async () => {
      const userId = 'test-user-id';

      mockUserModel.prototype.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.prototype.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null for non-existent user', async () => {
      const userId = 'non-existent-id';

      mockUserModel.prototype.findById.mockResolvedValue(null);

      const result = await userService.getUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    const createUserData: CreateUserRequest = {
      email: 'newuser@example.com',
      password: 'password123',
      full_name: 'New User',
      phone: '+628123456789',
      whatsapp_number: '+628123456789',
    };

    it('should create user successfully with hashed password', async () => {
      const hashedPassword = 'hashed-password-123';
      const expectedUserData = {
        ...createUserData,
        password: hashedPassword,
      };

      mockPasswordUtils.hashPassword.mockResolvedValue(hashedPassword);
      mockUserModel.prototype.createUser.mockResolvedValue(mockUser);

      const result = await userService.createUser(createUserData);

      expect(result).toEqual(mockUser);
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith(createUserData.password);
      expect(mockUserModel.prototype.createUser).toHaveBeenCalledWith(expectedUserData);
    });

    it('should throw error if email already exists', async () => {
      mockPasswordUtils.hashPassword.mockResolvedValue('hashed-password');
      mockUserModel.prototype.createUser.mockRejectedValue(new Error('Email already exists'));

      await expect(userService.createUser(createUserData)).rejects.toThrow('Email already exists');
    });

    it('should handle password hashing errors', async () => {
      mockPasswordUtils.hashPassword.mockRejectedValue(new Error('Hashing failed'));

      await expect(userService.createUser(createUserData)).rejects.toThrow('Hashing failed');
    });
  });

  describe('updateUser', () => {
    const userId = 'test-user-id';
    const updateData: UpdateUserRequest = {
      full_name: 'Updated Name',
      phone: '+628987654321',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };

      mockUserModel.prototype.updateUser.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUserModel.prototype.updateUser).toHaveBeenCalledWith(userId, updateData);
    });

    it('should return null for non-existent user', async () => {
      mockUserModel.prototype.updateUser.mockResolvedValue(null);

      const result = await userService.updateUser(userId, updateData);

      expect(result).toBeNull();
    });

    it('should throw error if email already exists', async () => {
      mockUserModel.prototype.updateUser.mockRejectedValue(new Error('Email already exists'));

      await expect(userService.updateUser(userId, updateData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'test-user-id';

      mockUserModel.prototype.delete.mockResolvedValue(true);

      const result = await userService.deleteUser(userId);

      expect(result).toBe(true);
      expect(mockUserModel.prototype.delete).toHaveBeenCalledWith(userId);
    });

    it('should return false if user does not exist', async () => {
      const userId = 'non-existent-id';

      mockUserModel.prototype.delete.mockResolvedValue(false);

      const result = await userService.deleteUser(userId);

      expect(result).toBe(false);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email successfully', async () => {
      const email = 'test@example.com';

      mockUserModel.prototype.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.prototype.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should return null for non-existent email', async () => {
      const email = 'nonexistent@example.com';

      mockUserModel.prototype.findByEmail.mockResolvedValue(null);

      const result = await userService.getUserByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmailWithPassword', () => {
    it('should return user with password hash', async () => {
      const email = 'test@example.com';
      const userWithPassword = { ...mockUser, password_hash: 'hashed-password' };

      mockUserModel.prototype.findByEmailWithPassword.mockResolvedValue(userWithPassword);

      const result = await userService.getUserByEmailWithPassword(email);

      expect(result).toEqual(userWithPassword);
      expect(mockUserModel.prototype.findByEmailWithPassword).toHaveBeenCalledWith(email);
    });

    it('should return null for non-existent email', async () => {
      const email = 'nonexistent@example.com';

      mockUserModel.prototype.findByEmailWithPassword.mockResolvedValue(null);

      const result = await userService.getUserByEmailWithPassword(email);

      expect(result).toBeNull();
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics successfully', async () => {
      const mockStats = {
        total: 100,
        active: 80,
        inactive: 20,
        recentlyCreated: 10,
      };

      mockUserModel.prototype.getUserStats.mockResolvedValue(mockStats);

      const result = await userService.getUserStats();

      expect(result).toEqual(mockStats);
      expect(mockUserModel.prototype.getUserStats).toHaveBeenCalled();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const userId = 'test-user-id';
      const deactivatedUser = { ...mockUser, is_active: false };

      mockUserModel.prototype.deactivateUser.mockResolvedValue(deactivatedUser);

      const result = await userService.deactivateUser(userId);

      expect(result).toEqual(deactivatedUser);
      expect(mockUserModel.prototype.deactivateUser).toHaveBeenCalledWith(userId);
    });

    it('should return null for non-existent user', async () => {
      const userId = 'non-existent-id';

      mockUserModel.prototype.deactivateUser.mockResolvedValue(null);

      const result = await userService.deactivateUser(userId);

      expect(result).toBeNull();
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const userId = 'test-user-id';
      const activatedUser = { ...mockUser, is_active: true };

      mockUserModel.prototype.activateUser.mockResolvedValue(activatedUser);

      const result = await userService.activateUser(userId);

      expect(result).toEqual(activatedUser);
      expect(mockUserModel.prototype.activateUser).toHaveBeenCalledWith(userId);
    });

    it('should return null for non-existent user', async () => {
      const userId = 'non-existent-id';

      mockUserModel.prototype.activateUser.mockResolvedValue(null);

      const result = await userService.activateUser(userId);

      expect(result).toBeNull();
    });
  });
});
