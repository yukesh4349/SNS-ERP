import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';

describe('AuthController', () => {
  let authController: AuthController;

  const mockUsersService = {
    findByIdentifier: jest.fn().mockImplementation((email: string) => {
      if (email === 'admin@sns-erp.local') {
        return Promise.resolve({
          id: 'admin-id',
          name: 'SNS ERP Admin',
          email: 'admin@sns-erp.local',
          password: 'ChangeMe123!',
          role: 'admin',
          department: 'Administration',
          status: 'active',
        });
      }
      return Promise.resolve(null);
    }),
  };

  const mockPrismaService = {};

  beforeEach(async () => {
    process.env.DEMO_USER_PASSWORD = 'ChangeMe123!';
    process.env.DEMO_USER_EMAIL = 'teacher@sns-erp.local';

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    authController = app.get<AuthController>(AuthController);
  });

  it('returns a token pair on login', async () => {
    const response = await authController.login({
      email: 'admin@sns-erp.local',
      password: 'ChangeMe123!',
    });

    expect(response.accessToken).toEqual(expect.any(String));
    expect(response.refreshToken).toEqual(expect.any(String));
    expect(response.user.role).toBe('admin');
  });
});
