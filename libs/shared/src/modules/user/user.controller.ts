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
import { Owner } from '@core/decorators/owner.decorator';
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
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
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
   * Update an entity document by using id
   */
  @Put(':id')
  @ApiOperation({ summary: `Update ${entity} using id` })
  @ResponseUpdated(User)
  async update(
    @Owner() owner: OwnerDto,
    @Param('id') id: string,
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
   * Get an entity document by using id
   */
  @Get(':id')
  @ApiOperation({ summary: `Find ${entity} using id` })
  @ResponseGetOne(User)
  async findById(
    @Owner() owner: OwnerDto,
    @Param('id') id: string,
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
  async delete(
    @Owner() owner: OwnerDto,
    @Param('id') id: string,
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
