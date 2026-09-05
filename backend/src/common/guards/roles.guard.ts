import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthTokenPayload } from '../../auth/auth.types';
import type { AppRole } from '../constants/roles';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & {
        user?: AuthTokenPayload;
      }
    >();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: no user context found.');
    }

    // Admin and superadmin bypass all role checks
    if (user.role === 'admin' || user.role === 'superadmin') {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      console.warn(`[RolesGuard] Denied access. User: ${user.email}, Role: ${user.role}, Required: ${requiredRoles}`);
      throw new ForbiddenException(
        `Access denied: requires one of [${requiredRoles.join(', ')}], but user has role '${user.role}'.`,
      );
    }

    return true;
  }
}
