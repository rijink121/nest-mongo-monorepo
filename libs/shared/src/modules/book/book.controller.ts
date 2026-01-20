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
import { Public } from '@core/decorators/public.decorator';
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
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';

// Entity name in snake_case for consistent API routes and documentation
const entity = snakeCase(Book.name);

@ApiTags(entity)
@ApiBearerAuth()
@ApiErrorResponses()
@ApiExtraModels(Book)
@Cache()
@Controller(entity)
@Public()
export class BookController {
  constructor(private readonly bookService: BookService) {}

  /**
   * Create a new entity document
   */
  @Post()
  @ApiOperation({ summary: `Create new ${entity}` })
  @ResponseCreated(Book)
  async create(
    @Owner() owner: OwnerDto,
    @Body() createBookDto: CreateBookDto,
    @Query() query: ApiQueryCreate,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.bookService.create({
      owner,
      action: 'create',
      body: { ...createBookDto },
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
  @ResponseUpdated(Book)
  async update(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookDto: UpdateBookDto,
    @Query() query: ApiQueryUpdate,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.bookService.update({
      owner,
      action: 'update',
      id,
      body: { ...updateBookDto },
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
  @ResponseGetAll(Book)
  async findAll(
    @Owner() owner: OwnerDto,
    @Query() query: ApiQueryGetAll,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data, offset, limit, count } =
      await this.bookService.findAll({
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
    const { error, count } = await this.bookService.getCount({
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
  @ResponseGetOne(Book)
  async findOne(
    @Owner() owner: OwnerDto,
    @Query() query: ApiQueryGetOne,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.bookService.findOne({
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
  @ResponseGetOne(Book)
  async findById(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ApiQueryGetById,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.bookService.findById({
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
  @ResponseDeleted(Book)
  async delete(
    @Owner() owner: OwnerDto,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ApiQueryDelete,
    @I18n() i18n: I18nContext,
  ) {
    const { error, data } = await this.bookService.delete({
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
