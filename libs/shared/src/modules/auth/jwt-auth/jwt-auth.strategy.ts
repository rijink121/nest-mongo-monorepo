import { OWNER_INCLUDE_ATTRIBUTES_KEY } from '@core/decorators/owner-attributes.decorator';
import { OWNER_INCLUDE_POPULATES_KEY } from '@core/decorators/owner-populates.decorator';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from '@shared/modules/user/user.service';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT payload structure containing authentication session information.
 *
 * @property sessionId - Unique identifier for the authentication session
 * @property userId - Unique identifier for the authenticated user
 */
export interface JwtPayload {
  sessionId: string;
  userId: string;
}

/**
 * JWT authentication strategy for validating and processing JWT tokens.
 *
 * This strategy extends Passport's JWT strategy to provide user authentication
 * via JWT tokens. It validates tokens, retrieves user data, and supports
 * dynamic attribute inclusion for owner-based access control.
 *
 * Features:
 * - Extracts JWT from Authorization Bearer header
 * - Validates token signature and expiration
 * - Retrieves user data from database with dynamic attributes
 * - Supports owner decorator metadata for selective field inclusion
 * - Enforces user active status check
 *
 * @example Usage in AuthGuard
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Request() req) {
 *   return req.user; // Contains validated user data
 * }
 * ```
 */
@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  /**
   * Initializes the JWT authentication strategy.
   *
   * Configures Passport JWT strategy with:
   * - Token extraction from Authorization Bearer header
   * - Token expiration validation
   * - Secret key for signature verification
   * - Request callback for accessing request metadata
   *
   * @param configService - NestJS configuration service for accessing JWT config
   * @param userService - User service for retrieving user data
   */
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract token from "Authorization: Bearer <token>"
      ignoreExpiration: false, // Reject expired tokens
      secretOrKey: configService.getOrThrow<string>('jwt.secret'), // Secret key for token verification
      passReqToCallback: true, // Pass request object to validate method for metadata access
    });
  }

  /**
   * Validates JWT payload and retrieves authenticated user data.
   *
   * This method is called automatically by Passport after successful token verification.
   * It performs the following operations:
   * 1. Extracts owner decorator metadata from request
   * 2. Retrieves user data from database with dynamic attributes and populations
   * 3. Validates user existence and active status
   * 4. Merges user data with JWT payload and requested attributes
   *
   * @param req - Express request object containing decorator metadata
   * @param payload - Decoded JWT payload containing sessionId and userId
   * @returns User object merged with JWT payload and requested attributes
   * @throws UnauthorizedException if user not found, inactive, or query fails
   *
   * @example Returned user object
   * ```typescript
   * {
   *   id: '123',
   *   email: 'user@example.com',
   *   role: 'admin',
   *   sessionId: 'sess_abc',
   *   userId: '123',
   *   // Additional attributes from @Owner decorator
   * }
   * ```
   */
  async validate(req: Request, payload: JwtPayload) {
    // Extract owner decorator metadata from request for dynamic attribute inclusion
    const includedAttributes = req[OWNER_INCLUDE_ATTRIBUTES_KEY] as string[];
    const includedPopulates = req[OWNER_INCLUDE_POPULATES_KEY] as string[];

    // Retrieve user data from database with requested attributes and populations
    const { error, data } = await this.userService.$db.findRecordById({
      id: +payload.userId,
      options: {
        attributes: { include: includedAttributes }, // Include specific attributes from @Owner decorator
        include: includedPopulates, // Populate relationships from @OwnerPopulates decorator
        allowEmpty: true, // Allow query even if no attributes specified
      },
    });

    // Validate user retrieval and active status
    if (error) {
      throw new InternalServerErrorException('Something went wrong');
    }

    if (!data || !data.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Extract values of included attributes for top-level access
    const includedAttributeValues: Record<string, unknown> = {};

    if (includedAttributes?.length > 0) {
      for (const attr of includedAttributes) {
        includedAttributeValues[attr] = data.getDataValue(attr);
      }
    }

    // Merge user data, JWT payload, and included attributes into final user object
    return {
      ...data.toJSON(), // Convert Mongoose document to plain object
      ...payload, // Include sessionId and userId from JWT
      ...includedAttributeValues, // Add requested attributes at top level
    };
  }
}
