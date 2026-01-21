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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role as RoleEnum } from '@shared/definitions/role.enum';
import { I18n, I18nContext } from 'nestjs-i18n';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { RoleService } from './role.service';

// Entity name in snake_case for consistent API routes and documentation
const entity = snakeCase(Role.name);

@ApiTags(entity)
@ApiBearerAuth()
@ApiErrorResponses()
@ApiExtraModels(Role)
@Cache()
@Controller(entity)
@Roles(RoleEnum.SuperAdmin)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * Create a new entity document
   */
  @Post()
  @ApiOperation({ summary: `Create new ${entity}` })
  @ResponseCreated(Role)
  async create(
    @Owner() owner: OwnerDto,
    @Body() createRoleDto: CreateRoleDto,
    @Query() query: ApiQueryCreate,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.roleService.create({
      owner,
      action: 'create',
      body: { ...createRoleDto },
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
  @Patch(':id')
  @ApiOperation({ summary: `Update ${entity} using id` })
  @ResponseUpdated(Role)
  async update(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @Query() query: ApiQueryUpdate,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.roleService.update({
      owner,
      action: 'update',
      id,
      body: { ...updateRoleDto },
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
  @ResponseGetAll(Role)
  async findAll(
    @Owner() owner: OwnerDto,
    @Query() query: ApiQueryGetAll,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data, offset, limit, count } =
      await this.roleService.findAll({
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
    const { error, count } = await this.roleService.getCount({
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
  @ResponseGetOne(Role)
  async findOne(
    @Owner() owner: OwnerDto,
    @Query() query: ApiQueryGetOne,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.roleService.findOne({
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
  @ResponseGetOne(Role)
  async findById(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ApiQueryGetById,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.roleService.findById({
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
  @ResponseDeleted(Role)
  async delete(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ApiQueryDelete,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.roleService.delete({
      owner,
      action: 'delete',
      id,
      payload: { ...query },
    });

    if (error) {
      console.log(error);
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
