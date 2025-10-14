import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for storing owner population configuration.
 * Used to track which related documents/relationships should be populated in authentication.
 */
export const OWNER_INCLUDE_POPULATES_KEY = 'owner_include_populates';

/**
 * Decorator to specify related documents/relationships to populate in the authenticated user object.
 *
 * This decorator works with the JWT authentication strategy to dynamically populate
 * MongoDB relationships (via Mongoose populate) in the user object. It's useful when
 * you need access to related documents like roles, departments, or profile data for
 * authorization or business logic without making additional database queries.
 *
 * The specified populations are:
 * - Extracted from the request metadata by the JWT strategy
 * - Used in the database query to populate relationships
 * - Included in the final user object available in request.user
 *
 * @param populates - Variable number of relationship keys from OwnerDto to populate
 * @returns Method decorator that sets metadata for relationship population
 *
 * @example Basic usage with Owner decorator
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get('profile')
 *   @OwnerIncludePopulate('role', 'department')
 *   getProfile(@Owner() owner: OwnerDto) {
 *     // owner.role and owner.department are fully populated objects
 *     console.log(owner.role.name); // Access populated role data
 *     console.log(owner.department.name); // Access populated department data
 *     return owner;
 *   }
 * }
 * ```
 *
 * @example Multiple relationships
 * ```typescript
 * @Get('dashboard')
 * @OwnerIncludePopulate('profile', 'settings', 'team')
 * getDashboard(@Owner() owner: OwnerDto) {
 *   // All specified relationships are populated
 *   const teamMembers = owner.team.members;
 *   const userPreferences = owner.settings.preferences;
 *   return this.dashboardService.build(owner);
 * }
 * ```
 *
 * @example With authorization logic
 * ```typescript
 * @Post('approve')
 * @OwnerIncludePopulate('role', 'permissions')
 * approveDocument(
 *   @Owner() owner: OwnerDto,
 *   @Body() dto: ApproveDto,
 * ) {
 *   // Use populated role data for authorization
 *   const canApprove = owner.role.permissions.includes('approve_documents');
 *   if (!canApprove) {
 *     throw new ForbiddenException('Insufficient permissions');
 *   }
 *   return this.documentService.approve(dto.id);
 * }
 * ```
 *
 * @example Combined with OwnerIncludeAttribute
 * ```typescript
 * @Get('admin/users')
 * @OwnerIncludeAttribute('accessLevel')
 * @OwnerIncludePopulate('role', 'department')
 * getAdminUsers(@Owner() owner: OwnerDto) {
 *   // Both attributes and populations are included
 *   if (owner.accessLevel < 10 || owner.role.name !== 'admin') {
 *     throw new ForbiddenException();
 *   }
 *   return this.userService.findAll();
 * }
 * ```
 */
export const OwnerIncludePopulate = (...populates: string[]) =>
  SetMetadata(OWNER_INCLUDE_POPULATES_KEY, populates);
