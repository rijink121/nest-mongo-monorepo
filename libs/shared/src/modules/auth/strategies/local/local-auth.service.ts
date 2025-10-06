import { Injectable } from '@nestjs/common';
import { User } from '@shared/modules/user/entities/user.entity';
import { UserService } from '@shared/modules/user/user.service';
import { compareSync } from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { LocalAuthDto } from './local-auth.dto';

/**
 * Response structure for authentication operations.
 */
export interface AuthResponse {
  /** Error message or object if authentication failed */
  error?: unknown;
  /** User entity if authentication succeeded */
  user?: User;
}

/**
 * Service responsible for local authentication (username/password) validation.
 *
 * This service handles the core authentication logic including:
 * - User lookup by email/username
 * - Password verification using bcrypt
 * - Account status validation
 * - Last login timestamp tracking
 */
@Injectable()
export class LocalAuthService {
  constructor(
    private readonly userService: UserService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Validates user credentials for local authentication strategy.
   *
   * This method performs a comprehensive authentication check:
   * 1. Looks up user by email (username field)
   * 2. Verifies password hash matches
   * 3. Checks if account is active
   * 4. Updates last login timestamp on success
   *
   * @param credentials - User login credentials
   * @param credentials.username - User's email address (used as username)
   * @param credentials.password - Plain text password to verify
   * @returns Promise resolving to AuthResponse with user data or error
   *
   * @example
   * ```typescript
   * const result = await authService.validateUser({
   *   username: 'user@example.com',
   *   password: 'secret123'
   * });
   *
   * if (result.error) {
   *   // Handle authentication failure
   * } else {
   *   // Use result.user for authenticated user
   * }
   * ```
   */
  async validateUser({
    username,
    password,
  }: LocalAuthDto): Promise<AuthResponse> {
    try {
      // Query user by email with password field included (normally excluded)
      const { error, data } = await this.userService.$db.findOneRecord({
        options: {
          projection: '+password', // Include password field in query result
          where: { email: username },
          allowEmpty: true, // Don't throw error if user not found
        },
      });

      // Handle database query errors
      if (error) {
        return { error };
      }

      // User not found in database
      if (!data) {
        return { error: this.i18n.t('auth.invalid') };
      }

      // Verify password hash matches
      if (!compareSync(password, data.password)) {
        return { error: this.i18n.t('auth.invalid') };
      }

      // Check if user account is active
      if (!data.active) {
        return { error: this.i18n.t('auth.inactive') };
      }

      // Update last login timestamp
      data.last_login_at = new Date();
      await data.save();

      // Return successful authentication with user data
      return { error: false, user: data };
    } catch (error: unknown) {
      // Handle unexpected errors during authentication
      return { error };
    }
  }
}
