import { ApiResponseOptions } from '@nestjs/swagger';

/**
 * Standard API response configurations for common HTTP error responses.
 * These can be used with @ApiResponse decorator to document expected error responses.
 */

/**
 * Bad Request (400) response configuration.
 * Used for validation errors and malformed requests.
 *
 * @example
 * ```typescript
 * @ApiResponse(ResponseBadRequest)
 * @Post('/users')
 * createUser(@Body() userData: CreateUserDto) { ... }
 * ```
 */
export const ResponseBadRequest: ApiResponseOptions = {
  description: 'Bad Request',
  schema: {
    properties: {
      statusCode: {
        type: 'number',
        example: 400,
      },
      error: {
        type: 'string',
        example: 'Bad Request',
      },
      message: {
        type: 'array',
        items: {
          properties: {
            property: {
              type: 'string',
              example: 'email',
            },
            value: {
              type: 'string',
              example: 'invalid@email',
            },
            constraints: {
              type: 'object',
              example: {
                isEmail: 'email should be a valid email',
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Unauthorized (401) response configuration.
 * Used when authentication is required but missing or invalid.
 *
 * @example
 * ```typescript
 * @ApiResponse(ResponseUnauthorized)
 * @UseGuards(AuthGuard)
 * @Get('/profile')
 * getProfile() { ... }
 * ```
 */
export const ResponseUnauthorized: ApiResponseOptions = {
  description: 'Unauthorized',
  schema: {
    properties: {
      statusCode: {
        type: 'number',
        example: 401,
      },
      error: {
        type: 'string',
        example: 'Unauthorized',
      },
      message: {
        type: 'string',
        example: 'Invalid credentials',
      },
    },
  },
};

/**
 * Forbidden (403) response configuration.
 * Used when the user is authenticated but lacks permission to access the resource.
 *
 * @example
 * ```typescript
 * @ApiResponse(ResponseForbidden)
 * @UseGuards(RolesGuard)
 * @Roles('admin')
 * @Delete('/users/:id')
 * deleteUser(@Param('id') id: string) { ... }
 * ```
 */
export const ResponseForbidden: ApiResponseOptions = {
  description: 'Forbidden',
  schema: {
    properties: {
      statusCode: {
        type: 'number',
        example: 403,
      },
      error: {
        type: 'string',
        example: 'Forbidden',
      },
      message: {
        type: 'string',
        example: 'Access denied: insufficient permissions',
      },
    },
  },
};

/**
 * Internal Server Error (500) response configuration.
 * Used when an unexpected error occurs on the server side.
 *
 * @example
 * ```typescript
 * @ApiResponse(ResponseInternalServerError)
 * @Post('/process-data')
 * processData(@Body() data: ProcessDataDto) { ... }
 * ```
 */
export const ResponseInternalServerError: ApiResponseOptions = {
  description: 'Internal Server Error',
  schema: {
    properties: {
      statusCode: {
        type: 'number',
        example: 500,
      },
      error: {
        type: 'string',
        example: 'Internal Server Error',
      },
      message: {
        type: 'string',
        example: 'An unexpected error occurred while processing the request',
      },
    },
  },
};
