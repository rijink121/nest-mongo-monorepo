import {
  ApiErrorResponses,
  ResponseCountAll,
  ResponseCreated,
  ResponseDeleted,
  ResponseGetAll,
  ResponseGetOne,
  ResponseUpdated,
} from '@core/decorators/api.decorator';
import { Cache } from '@core/decorators/cache.decorator';
import { OwnerIncludeAttribute } from '@core/decorators/owner-attributes.decorator';
import { Owner } from '@core/decorators/owner.decorator';
import { Roles } from '@core/decorators/roles.decorator';
import {
  ApiQueryCountAll,
  ApiQueryCreate,
  ApiQueryDelete,
  ApiQueryGetAll,
  ApiQueryGetById,
  ApiQueryGetOne,
  ApiQueryUpdate,
} from '@core/definitions/api-query.dto';
import type { OwnerDto } from '@core/types/owner';
import { pluralizeString, snakeCase } from '@core/utils';
import { NotFoundError } from '@core/utils/error';
import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@shared/definitions/role.enum';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

// Entity name in snake_case for consistent API routes and documentation
const entity = snakeCase(User.name);

@ApiTags(entity)
@ApiBearerAuth()
@ApiErrorResponses()
@ApiExtraModels(User)
@Cache()
@Controller(entity)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Create a new entity document
   */
  @Post()
  @ApiOperation({ summary: `Create new ${entity}` })
  @ResponseCreated(User)
  @Roles(Role.SuperAdmin)
  async create(
    @Owner() owner: OwnerDto,
    @Body() createUserDto: CreateUserDto,
    @Query() query: ApiQueryCreate,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.userService.create({
      owner,
      action: 'create',
      body: { ...createUserDto },
      payload: { ...query },
    });

    if (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }

    return {
      data: { [entity]: data },
      message: i18n.t('crud.created', { args: { entity } }),
    };
  }

  /**
   * Update logged in user details
   */
  @Patch('me')
  @ApiOperation({ summary: 'Update logged in user details' })
  @ResponseUpdated(User)
  async updateMe(
    @Owner() owner: OwnerDto,
    @Body() updateUserDto: UpdateUserDto,
    @Query() query: ApiQueryUpdate,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.userService.update({
      owner,
      action: 'update',
      id: +owner.id,
      body: { ...updateUserDto },
      payload: { ...query },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(
          i18n.t('crud.notFound', { args: { entity } }),
        );
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }

    return {
      data: { [entity]: data },
      message: i18n.t('crud.updated', { args: { entity } }),
    };
  }

  /**
   * Change password for logged in user
   */
  @Patch('password')
  @ApiOperation({ summary: 'Change password for logged in user' })
  @ApiOkResponse({
    description: 'Success',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Password changed',
        },
      },
    },
  })
  @OwnerIncludeAttribute('password')
  async changePassword(
    @Owner() owner: OwnerDto & { password: string },
    @Body() changePasswordDto: ChangePasswordDto,
    @I18n() i18n: I18nContext,
  ) {
    const { error } = await this.userService.changePassword({
      owner,
      action: 'changePassword',
      payload: { ...changePasswordDto, user_password: owner.password },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(
          i18n.t('crud.notFound', { args: { entity } }),
        );
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }

    return {
      message: i18n.t('crud.passwordChanged', { args: { entity } }),
    };
  }

  /**
   * Update an entity document by using id
   */
  @Patch(':id')
  @ApiOperation({ summary: `Update ${entity} using id` })
  @ResponseUpdated(User)
  @Roles(Role.SuperAdmin)
  async update(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Query() query: ApiQueryUpdate,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.userService.update({
      owner,
      action: 'update',
      id,
      body: { ...updateUserDto },
      payload: { ...query },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(
          i18n.t('crud.notFound', { args: { entity } }),
        );
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }

    return {
      data: { [entity]: data },
      message: i18n.t('crud.updated', { args: { entity } }),
    };
  }

  /**
   * Return all entity documents list
   */
  @Get()
  @ApiOperation({ summary: `Get all ${pluralizeString(entity)}` })
  @ResponseGetAll(User)
  async findAll(
    @Owner() owner: OwnerDto,
    @Query() query: ApiQueryGetAll,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data, offset, limit, count } =
      await this.userService.findAll({
        owner,
        action: 'findAll',
        payload: { ...query },
      });

    if (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }

    const pluralizedEntity = pluralizeString(entity);
    return {
      data: { [pluralizedEntity]: data, offset, limit, count },
      message: i18n.t('crud.list', {
        args: { entity: pluralizedEntity },
      }),
    };
  }

  /**
   * Return count of entity documents
   */
  @Get('count')
  @ApiOperation({ summary: `Get count of ${pluralizeString(entity)}` })
  @ResponseCountAll()
  async countAll(
    @Owner() owner: OwnerDto,
    @Query() query: ApiQueryCountAll,
    @I18n() i18n: I18nContext,
  ) {
    const { error, count } = await this.userService.getCount({
      owner,
      action: 'getCount',
      payload: { ...query },
    });

    if (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }
    return {
      data: { count },
      message: i18n.t('crud.count', { args: { entity } }),
    };
  }

  /**
   * Find one entity document
   */
  @Get('find')
  @ApiOperation({ summary: `Find one ${entity}` })
  @ResponseGetOne(User)
  async findOne(
    @Owner() owner: OwnerDto,
    @Query() query: ApiQueryGetOne,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.userService.findOne({
      owner,
      action: 'findOne',
      payload: { ...query },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(
          i18n.t('crud.notFound', { args: { entity } }),
        );
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }
    return {
      data: { [entity]: data },
      message: i18n.t('crud.retrieve', { args: { entity } }),
    };
  }

  /**
   * Get logged in user details
   */
  @Get('me')
  @ApiOperation({ summary: `Get logged in user details` })
  @ResponseGetOne(User)
  async me(
    @Owner() owner: OwnerDto,
    @Query() query: ApiQueryGetById,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.userService.findById({
      owner,
      action: 'findById',
      id: +owner.id,
      payload: { ...query },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(
          i18n.t('crud.notFound', { args: { entity } }),
        );
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }
    return {
      data: { [entity]: data },
      message: i18n.t('crud.retrieve', { args: { entity } }),
    };
  }

  /**
   * Get an entity document by using id
   */
  @Get(':id')
  @ApiOperation({ summary: `Find ${entity} using id` })
  @ResponseGetOne(User)
  async findById(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ApiQueryGetById,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.userService.findById({
      owner,
      action: 'findById',
      id,
      payload: { ...query },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(
          i18n.t('crud.notFound', { args: { entity } }),
        );
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }
    return {
      data: { [entity]: data },
      message: i18n.t('crud.retrieve', { args: { entity } }),
    };
  }

  /**
   * Delete an entity document by using id
   */
  @Delete(':id')
  @ApiOperation({ summary: `Delete ${entity} using id` })
  @ResponseDeleted(User)
  @Roles(Role.SuperAdmin)
  async delete(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ApiQueryDelete,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.userService.delete({
      owner,
      action: 'delete',
      id,
      payload: { ...query },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(
          i18n.t('crud.notFound', { args: { entity } }),
        );
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }
    return {
      data: { [entity]: data },
      message: i18n.t('crud.deleted', { args: { entity } }),
    };
  }
}
