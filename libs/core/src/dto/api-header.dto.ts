import { ApiHeaderOptions } from '@nestjs/swagger';

/**
 * API Header configuration for application versioning.
 * Used to specify which version of the API the client wants to interact with.
 *
 * @example
 * ```typescript
 * // Usage in controller
 * @ApiHeader(VersionHeader)
 * @Get('/users')
 * getUsers() { ... }
 * ```
 */
export const VersionHeader: ApiHeaderOptions = {
  name: 'X-Application-Version',
  description: 'Application Version',
  enum: ['1.0', '2.0', '3.0'],
};
