import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to mark routes as public (no authentication required).
 * This key is checked by authentication guards to allow unauthenticated access.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route or controller as public (no authentication required).
 *
 * Usage:
 * ```typescript
 * @Public()
 * @Get('public-endpoint')
 * getPublicData() {
 *   return 'This endpoint is public';
 * }
 * ```
 *
 * Guards can check for this metadata to bypass authentication for marked routes.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
