import { trimAndValidate } from '@core/utils/validate';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@shared/modules/user/entities/user.entity';
import { Strategy } from 'passport-local';
import { LocalAuthDto } from './local-auth.dto';
import { LocalAuthService } from './local-auth.service';

/**
 * Passport strategy for local authentication (username/password).
 *
 * This strategy integrates with Passport.js to provide traditional username/password
 * authentication for the application. It validates credentials, trims input fields,
 * and returns the authenticated user object that gets attached to the request.
 *
 * The strategy is automatically invoked when using the `@UseGuards(LocalAuthGuard)`
 * decorator on controllers or routes.
 *
 * Authentication Flow:
 * 1. Extract username and password from request body
 * 2. Trim and validate credentials against LocalAuthDto
 * 3. Verify credentials with LocalAuthService
 * 4. Return authenticated user or throw UnauthorizedException
 *
 * @example Controller usage
 * ```typescript
 * @Post('login')
 * @UseGuards(LocalAuthGuard)
 * async login(@Request() req) {
 *   // req.user contains the authenticated User object
 *   return { user: req.user, token: this.authService.generateToken(req.user) };
 * }
 * ```
 */
@Injectable()
export class LocalAuthStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: LocalAuthService) {
    // Configure passport-local strategy with default field names
    super();
  }

  /**
   * Validates user credentials for authentication.
   *
   * This method is automatically called by Passport.js during authentication.
   * It trims the input fields, validates them against the DTO schema, and
   * verifies the credentials with the authentication service.
   *
   * @param username - User's username (email address)
   * @param password - User's plain text password
   * @returns Promise resolving to authenticated User entity
   * @throws UnauthorizedException if credentials are invalid or authentication fails
   *
   * Security Notes:
   * - Password field is excluded from trimming to preserve exact input
   * - Username is trimmed to handle whitespace input errors
   * - All validation errors are caught and converted to UnauthorizedException
   */
  async validate(username: string, password: string): Promise<User> {
    // Trim and validate credentials against DTO schema
    // Password is excluded from trimming to preserve exact input
    const authBody = await trimAndValidate(
      LocalAuthDto,
      { username, password },
      ['password'],
    );

    // Validate credentials with authentication service
    const { error, user } = await this.authService.validateUser(authBody);

    // Throw exception if authentication failed
    if (error) {
      throw new UnauthorizedException(error);
    }

    // Return authenticated user (will be attached to request.user)
    return user as User;
  }
}
