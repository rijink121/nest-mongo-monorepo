import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for storing owner attribute inclusion configuration.
 * Used to track which additional owner attributes should be included in authentication.
 */
export const OWNER_INCLUDE_ATTRIBUTES_KEY = 'owner_include_attributes';

/**
 * Decorator to specify additional owner attributes to include in the authenticated user object.
 *
 * This decorator works with the JWT authentication strategy to dynamically include
 * specific database attributes in the user object. It's useful when you need access
 * to attributes beyond the default user fields for authorization or business logic.
 *
 * The specified attributes are:
 * - Extracted from the request metadata by the JWT strategy
 * - Included in the database query for the authenticated user
 * - Added to the final user object available in request.user
 *
 * @param attributes - Variable number of attribute keys from OwnerDto to include
 * @returns Method decorator that sets metadata for attribute inclusion
 *
 * @example Basic usage with Owner decorator
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get('profile')
 *   @OwnerIncludeAttribute('permissions', 'preferences')
 *   getProfile(@Owner() owner: OwnerDto) {
 *     // owner now includes permissions and preferences attributes
 *     console.log(owner.permissions, owner.preferences);
 *     return owner;
 *   }
 * }
 * ```
 *
 * @example Including password attribute
 * ```typescript
 * @Post('change-password')
 * @OwnerIncludeAttribute('password')
 * changePassword(
 *   @Owner() owner: OwnerDto & { password: string },
 *   @Body() dto: ChangePasswordDto,
 * ) {
 *   // owner.password is now available for validation
 *   if (!this.comparePasswords(dto.oldPassword, owner.password)) {
 *     throw new BadRequestException('Invalid password');
 *   }
 *   return this.userService.updatePassword(owner.id, dto.newPassword);
 * }
 * ```
 *
 * @example Multiple attributes for authorization
 * ```typescript
 * @Get('dashboard')
 * @OwnerIncludeAttribute('role', 'department', 'accessLevel')
 * getDashboard(@Owner() owner: OwnerDto) {
 *   // Access additional attributes for authorization
 *   if (owner.accessLevel < 5) {
 *     throw new ForbiddenException();
 *   }
 *   return this.dashboardService.build(owner);
 * }
 * ```
 */
export const OwnerIncludeAttribute = (...attributes: string[]) =>
  SetMetadata(OWNER_INCLUDE_ATTRIBUTES_KEY, attributes);
