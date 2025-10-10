import {
  ResponseBadRequest,
  ResponseForbidden,
  ResponseInternalServerError,
} from '@core/definitions/api-response.dto';
import { snakeCase } from '@core/utils';
import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import pluralize from 'pluralize-esm';

/**
 * Swagger response decorator for "Get All" operations with pagination support.
 * Creates a standardized response schema for list endpoints with metadata.
 *
 * @param model - The model class/type for the array items
 * @param collection - Optional collection name override (defaults to pluralized snake_case model name)
 * @returns Combined decorators for API documentation
 *
 * @example
 * ```typescript
 * @ResponseGetAll(User)
 * @Get('/users')
 * getAllUsers() { ... }
 *
 * @ResponseGetAll(Product, 'items')
 * @Get('/products')
 * getAllProducts() { ... }
 * ```
 */
export const ResponseGetAll = <TModel extends Type<any>>(
  model: TModel,
  collection?: string,
) => {
  return applyDecorators(
    ApiOkResponse({
      description: 'Successfully retrieved list of records',
      schema: {
        properties: {
          data: {
            type: 'object',
            properties: {
              offset: {
                type: 'number',
                description: 'Number of records skipped for pagination',
                example: 0,
              },
              limit: {
                type: 'number',
                description: 'Maximum number of records returned',
                example: 10,
              },
              count: {
                type: 'number',
                description: 'Total number of records available',
                example: 100,
              },
              [collection || pluralize(snakeCase(model.name))]: {
                type: 'array',
                description: `Array of ${model.name} objects`,
                items: {
                  $ref: getSchemaPath(model),
                },
              },
            },
          },
          message: {
            type: 'string',
            example: 'Records retrieved successfully',
          },
        },
      },
    }),
  );
};

/**
 * Swagger decorator for count all records response
 * @returns Decorator for API count response
 * @example
 * ```typescript
 * @ResponseCountAll()
 * @Get('count')
 * async countUsers() {
 *   return await this.userService.count();
 * }
 * ```
 */
export const ResponseCountAll = () => {
  return applyDecorators(
    ApiOkResponse({
      description: 'Successfully retrieved count of records',
      schema: {
        properties: {
          data: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
                description: 'Total number of records available',
                example: 150,
              },
            },
          },
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Count retrieved successfully',
          },
        },
      },
    }),
  );
};

/**
 * Swagger decorator for create record response
 * @template TModel - The model class type
 * @param model - The model class to generate create response schema
 * @returns Decorator for API create response
 * @example
 * ```typescript
 * @ResponseCreated(UserEntity)
 * @Post()
 * async createUser(@Body() createUserDto: CreateUserDto) {
 *   return await this.userService.create(createUserDto);
 * }
 * ```
 */
export const ResponseCreated = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiCreatedResponse({
      description: 'Record created successfully',
      schema: {
        properties: {
          data: {
            type: 'object',
            description: 'Created record data',
            properties: {
              [snakeCase(model.name)]: {
                $ref: getSchemaPath(model),
                description: `The created ${model.name} object`,
              },
            },
          },
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Record created successfully',
          },
        },
      },
    }),
  );
};

/**
 * Swagger decorator for update record response
 * @template TModel - The model class type
 * @param model - The model class to generate update response schema
 * @returns Decorator for API update response
 * @example
 * ```typescript
 * @ResponseUpdated(UserEntity)
 * @Patch(':id')
 * async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
 *   return await this.userService.update(id, updateUserDto);
 * }
 * ```
 */
export const ResponseUpdated = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      description: 'Record updated successfully',
      schema: {
        properties: {
          data: {
            type: 'object',
            description: 'Updated record data',
            properties: {
              [snakeCase(model.name)]: {
                $ref: getSchemaPath(model),
                description: `The updated ${model.name} object`,
              },
            },
          },
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Record updated successfully',
          },
        },
      },
    }),
  );
};

/**
 * Swagger decorator for get single record response
 * @template TModel - The model class type
 * @param model - The model class to generate get one response schema
 * @returns Decorator for API get one response
 * @example
 * ```typescript
 * @ResponseGetOne(UserEntity)
 * @Get(':id')
 * async getUser(@Param('id') id: string) {
 *   return await this.userService.findById(id);
 * }
 * ```
 */
export const ResponseGetOne = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      description: 'Successfully retrieved single record',
      schema: {
        properties: {
          data: {
            type: 'object',
            description: 'Retrieved record data',
            properties: {
              [snakeCase(model.name)]: {
                $ref: getSchemaPath(model),
                description: `The ${model.name} object`,
              },
            },
          },
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Record retrieved successfully',
          },
        },
      },
    }),
  );
};

/**
 * Swagger decorator for delete record response
 * @template TModel - The model class type
 * @param model - The model class to generate delete response schema
 * @returns Decorator for API delete response
 * @example
 * ```typescript
 * @ResponseDeleted(UserEntity)
 * @Delete(':id')
 * async deleteUser(@Param('id') id: string) {
 *   return await this.userService.delete(id);
 * }
 * ```
 */
export const ResponseDeleted = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      description: 'Record deleted successfully',
      schema: {
        properties: {
          data: {
            type: 'object',
            description: 'Deleted record data',
            properties: {
              [snakeCase(model.name)]: {
                $ref: getSchemaPath(model),
                description: `The deleted ${model.name} object`,
              },
            },
          },
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Record deleted successfully',
          },
        },
      },
    }),
  );
};

/**
 * Swagger decorator for common API error responses
 * @returns Decorator for API error responses (400, 403, 500)
 * @example
 * ```typescript
 * @ApiErrorResponses()
 * @Get()
 * async getUsers() {
 *   return await this.userService.findAll();
 * }
 * ```
 */
export const ApiErrorResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse(ResponseBadRequest),
    ApiForbiddenResponse(ResponseForbidden),
    ApiInternalServerErrorResponse(ResponseInternalServerError),
  );
};
