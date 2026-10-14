import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Allow Swagger UI and OpenAPI JSON endpoints without authentication
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    if (path.startsWith('/api/docs')) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: Error | null, user: TUser, _info: Error | null): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Accès non autorisé');
    }
    return user;
  }
}