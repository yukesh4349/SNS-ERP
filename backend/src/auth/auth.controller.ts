import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { AuthService } from './auth.service';
import type { LoginDto, RefreshTokenDto } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() payload: LoginDto) {
    try {
      return await this.authService.login(payload);
    } catch (err) {
      throw err;
    }
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() payload: RefreshTokenDto) {
    return await this.authService.refresh(payload.refreshToken);
  }

  @Get('me')
  async me(@Req() request: AuthenticatedRequest) {
    return await this.authService.getProfile(request.user.sub);
  }

  @Post('change-password')
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return await this.authService.changePassword(
      request.user.sub,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Patch('profile')
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: { name?: string; email?: string },
  ) {
    return await this.authService.updateProfile(request.user.sub, body);
  }

  // Parent submits a profile update request for admin approval
  @Post('profile-request')
  async createProfileRequest(
    @Req() request: AuthenticatedRequest,
    @Body() body: Record<string, string>,
  ) {
    return await this.authService.createProfileRequest(request.user.sub, body);
  }

  // Parent checks their own request history
  @Get('profile-requests/mine')
  async getMyProfileRequests(@Req() request: AuthenticatedRequest) {
    return await this.authService.getMyProfileRequests(request.user.sub);
  }

  // Admin: list all pending profile update requests
  @Get('profile-requests')
  @Roles('admin')
  async getProfileRequests() {
    return await this.authService.getProfileRequests();
  }

  // Admin: approve or reject a request
  @Patch('profile-requests/:id')
  @Roles('admin')
  async resolveProfileRequest(
    @Param('id') id: string,
    @Body() body: { action: 'approved' | 'rejected'; adminNote?: string },
  ) {
    return await this.authService.resolveProfileRequest(id, body.action, body.adminNote);
  }

  // Verify student credentials and return their profile (for "Link Student")
  @Public()
  @Post('verify-student')
  async verifyStudent(@Body() body: { studentId: string; password: string }) {
    return await this.authService.verifyStudent(body.studentId, body.password);
  }
}
