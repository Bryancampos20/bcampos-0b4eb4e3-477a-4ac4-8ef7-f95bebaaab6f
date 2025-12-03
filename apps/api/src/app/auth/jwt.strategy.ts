import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '@shared/auth';
import { Role } from '@shared/data';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  organizationId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    // Configure the underlying Passport JWT strategy.
    // This defines how tokens are extracted, validated, and signed.
    super({
      // Extracts the JWT from the standard Authorization header:
      //    Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject expired tokens automatically. Passport will throw before `validate` is called.
      ignoreExpiration: false,

      // Secret used to verify the JWT signature.
      // This MUST match the secret used when signing tokens in AuthService.
      // Pulls from environment variables, with a dev fallback for convenience.
      secretOrKey:
        configService.get<string>('JWT_SECRET') ??
        'dev-secret', // fallback for local development only
    });
  }

  /**
   * The `validate` method is invoked after the token has been successfully decoded
   * and verified. At this point, the payload is trusted.
   *
   * Whatever object is returned here becomes `req.user` in the request context.
   *
   * This method maps the raw JWT payload into our internal `AuthUser` structure,
   * which is used uniformly across guards, controllers, and services.
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    return {
      id: payload.sub, // `sub` is the standard JWT "subject" claim (user identifier)
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    };
  }
}
