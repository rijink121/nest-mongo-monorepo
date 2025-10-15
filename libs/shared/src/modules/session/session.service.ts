import { JobResponse } from '@core/utils/job';
import { ModelService, MongoService } from '@lib/mongo';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtService } from '@nestjs/jwt';
import moment from 'moment-timezone';
import { Session } from './entities/session.entity';

/**
 * Service responsible for session management and JWT token operations.
 *
 * This service extends ModelService to provide CRUD operations for sessions
 * and adds specialized methods for JWT token lifecycle management including:
 * - Token creation with configurable expiry
 * - Token verification for authentication
 * - Token decoding for inspection (ignoring expiration)
 *
 * All JWT operations use configuration from the application's JWT module
 * settings for consistent security across the application.
 */
@Injectable()
export class SessionService extends ModelService<Session> {
  constructor(
    db: MongoService<Session>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super(db);
  }

  /**
   * Creates a signed JWT token with the provided payload.
   *
   * This method generates a JWT token using the application's configured secret
   * and signing options. The token expiry is calculated based on the configured
   * expiresIn value and returned as a moment object for easy manipulation.
   *
   * @template T - The type of the payload object
   * @param payload - The data to encode in the JWT token
   * @returns JobResponse containing the signed token and expiry timestamp, or error
   *
   * @example
   * ```typescript
   * const { data, error } = this.sessionService.createToken({
   *   userId: '123',
   *   email: 'user@example.com',
   *   role: 'admin'
   * });
   *
   * if (data) {
   *   console.log('Token:', data.token);
   *   console.log('Expires at:', data.tokenExpiry.format());
   * }
   * ```
   */
  async createToken<T extends object>(
    payload: T,
  ): Promise<JobResponse<{ token: string; tokenExpiry: moment.Moment }>> {
    try {
      // Retrieve JWT configuration from application settings
      const { secret, signOptions } =
        this.configService.getOrThrow<JwtModuleOptions>('jwt');

      // Sign the payload to create a JWT token
      const token = await this.jwtService.signAsync(payload, {
        secret,
      });

      // Calculate token expiry based on configured duration
      const tokenExpiry = moment().add(signOptions?.expiresIn, 'seconds');

      return { data: { token, tokenExpiry } };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Verifies a JWT token and returns its decoded payload.
   *
   * This method validates the token's signature and expiration time. If the token
   * is expired or has an invalid signature, an error is returned. Use this method
   * for authentication and authorization checks where token validity is critical.
   *
   * @template T - The expected type of the decoded payload
   * @param token - The JWT token string to verify
   * @returns JobResponse containing the decoded payload, or error if verification fails
   *
   * @example
   * ```typescript
   * const { data, error } = this.sessionService.verifyToken<UserPayload>(token);
   *
   * if (error) {
   *   // Token is invalid, expired, or has bad signature
   *   throw new UnauthorizedException('Invalid token');
   * }
   *
   * // Token is valid, use the payload
   * const user = data.payload;
   * ```
   */
  async verifyToken<T extends object>(
    token: string,
  ): Promise<JobResponse<{ payload: T }>> {
    try {
      // Retrieve JWT secret from configuration
      const { secret } = this.configService.getOrThrow<JwtModuleOptions>('jwt');

      // Verify token signature and expiration
      const data: T = await this.jwtService.verifyAsync(token, {
        secret,
      });

      return { data: { payload: data } };
    } catch (error) {
      // Token verification failed (expired, invalid signature, malformed, etc.)
      return { error };
    }
  }

  /**
   * Decodes a JWT token without verifying its expiration time.
   *
   * This method extracts the payload from a JWT token while ignoring whether
   * the token has expired. It still verifies the signature to ensure the token
   * is authentic. Use this method when you need to inspect token contents for
   * logging, debugging, or token refresh scenarios where expiry doesn't matter.
   *
   * WARNING: This method should NOT be used for authentication/authorization
   * decisions since it ignores expiration. Use verifyToken() instead for
   * security-critical operations.
   *
   * @template T - The expected type of the decoded payload
   * @param token - The JWT token string to decode
   * @returns JobResponse containing the decoded payload, or error if signature is invalid
   *
   * @example Inspecting expired tokens
   * ```typescript
   * const { data, error } = this.sessionService.decodeToken<UserPayload>(expiredToken);
   *
   * if (data) {
   *   // Can access payload even if token is expired
   *   console.log('User ID from expired token:', data.payload.userId);
   *   console.log('Token issued at:', data.payload.iat);
   * }
   * ```
   *
   * @example Token refresh flow
   * ```typescript
   * // Decode old token to get user info for refresh
   * const { data: oldData } = this.sessionService.decodeToken(oldToken);
   *
   * if (oldData) {
   *   // Create new token with same user info
   *   const { data: newData } = this.sessionService.createToken({
   *     userId: oldData.payload.userId
   *   });
   * }
   * ```
   */
  async decodeToken<T extends object>(
    token: string,
  ): Promise<JobResponse<{ payload: T }>> {
    try {
      // Retrieve JWT secret from configuration
      const { secret } = this.configService.getOrThrow<JwtModuleOptions>('jwt');

      // Decode token ignoring expiration (still verifies signature)
      const decoded: T = await this.jwtService.verifyAsync(token, {
        secret,
        ignoreExpiration: true, // Skip expiration check but verify signature
      });

      return { data: { payload: decoded } };
    } catch (error) {
      // Token decoding failed (invalid signature, malformed token, etc.)
      return { error };
    }
  }
}
