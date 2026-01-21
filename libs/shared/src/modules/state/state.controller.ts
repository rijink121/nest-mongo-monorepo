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
import { Role } from '@shared/definitions/role.enum';
import { I18n, I18nContext } from 'nestjs-i18n';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { State } from './entities/state.entity';
import { StateService } from './state.service';

// Entity name in snake_case for consistent API routes and documentation
const entity = snakeCase(State.name);

@ApiTags(entity)
@ApiBearerAuth()
@ApiErrorResponses()
@ApiExtraModels(State)
@Cache()
@Controller(entity)
export class StateController {
  constructor(private readonly stateService: StateService) {}

  /**
   * Create a new entity document
   */
  @Post()
  @ApiOperation({ summary: `Create new ${entity}` })
  @ResponseCreated(State)
  @Roles(Role.SuperAdmin)
  async create(
    @Owner() owner: OwnerDto,
    @Body() createStateDto: CreateStateDto,
    @Query() query: ApiQueryCreate,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.stateService.create({
      owner,
      action: 'create',
      body: { ...createStateDto },
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
  @ResponseUpdated(State)
  @Roles(Role.SuperAdmin)
  async update(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStateDto: UpdateStateDto,
    @Query() query: ApiQueryUpdate,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.stateService.update({
      owner,
      action: 'update',
      id,
      body: { ...updateStateDto },
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
  @ResponseGetAll(State)
  async findAll(
    @Owner() owner: OwnerDto,
    @Query() query: ApiQueryGetAll,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data, offset, limit, count } =
      await this.stateService.findAll({
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
    const { error, count } = await this.stateService.getCount({
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
  @ResponseGetOne(State)
  async findOne(
    @Owner() owner: OwnerDto,
    @Query() query: ApiQueryGetOne,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.stateService.findOne({
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
  @ResponseGetOne(State)
  async findById(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ApiQueryGetById,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.stateService.findById({
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
  @ResponseDeleted(State)
  @Roles(Role.SuperAdmin)
  async delete(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ApiQueryDelete,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.stateService.delete({
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
