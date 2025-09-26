import {
  ApiErrorResponses,
  ResponseCountAll,
  ResponseCreated,
  ResponseDeleted,
  ResponseGetAll,
  ResponseGetOne,
  ResponseUpdated,
} from '@core/decorators/api';
import { Owner } from '@core/decorators/owner';
import {
  ApiQueryCountAll,
  ApiQueryCreate,
  ApiQueryDelete,
  ApiQueryGetAll,
  ApiQueryGetById,
  ApiQueryGetOne,
  ApiQueryUpdate,
} from '@core/dto/api-query.dto';
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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';

// Entity name in snake_case for consistent API routes and documentation
const entity = snakeCase(Product.name);

@ApiTags(entity)
@ApiBearerAuth()
@ApiErrorResponses()
@ApiExtraModels(Product)
@Controller(entity)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Create a new entity document
   */
  @Post()
  @ApiOperation({ summary: `Create new ${entity}` })
  @ResponseCreated(Product)
  async create(
    @Owner() owner: OwnerDto,
    @Body() createProductDto: CreateProductDto,
    @Query() query: ApiQueryCreate,
  ) {
    const { error, data } = await this.productService.create({
      owner,
      action: 'create',
      body: { ...createProductDto },
      payload: { ...query },
    });

    if (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }

    return { data: { [entity]: data }, message: 'Created' };
  }

  /**
   * Update an entity document by using id
   */
  @Put(':id')
  @ApiOperation({ summary: `Update ${entity} using id` })
  @ResponseUpdated(Product)
  async update(
    @Owner() owner: OwnerDto,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Query() query: ApiQueryUpdate,
  ) {
    const { error, data } = await this.productService.update({
      owner,
      action: 'update',
      id,
      body: { ...updateProductDto },
      payload: { ...query },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException('Record not found');
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }

    return { data: { [entity]: data }, message: 'Updated' };
  }

  /**
   * Return all entity documents list
   */
  @Get()
  @ApiOperation({ summary: `Get all ${pluralizeString(entity)}` })
  @ResponseGetAll(Product)
  async findAll(@Owner() owner: OwnerDto, @Query() query: ApiQueryGetAll) {
    const { error, data, offset, limit, count } =
      await this.productService.findAll({
        owner,
        action: 'findAll',
        payload: { ...query },
      });

    if (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }
    return {
      data: { [pluralizeString(entity)]: data, offset, limit, count },
      message: 'Ok',
    };
  }

  /**
   * Return count of entity documents
   */
  @Get('count')
  @ApiOperation({ summary: `Get count of ${pluralizeString(entity)}` })
  @ResponseCountAll()
  async countAll(@Owner() owner: OwnerDto, @Query() query: ApiQueryCountAll) {
    const { error, count } = await this.productService.getCount({
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
      message: 'Ok',
    };
  }

  /**
   * Find one entity document
   */
  @Get('find')
  @ApiOperation({ summary: `Find one ${entity}` })
  @ResponseGetOne(Product)
  async findOne(@Owner() owner: OwnerDto, @Query() query: ApiQueryGetOne) {
    const { error, data } = await this.productService.findOne({
      owner,
      action: 'findOne',
      payload: { ...query },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException('Record not found');
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }
    return { data: { [entity]: data }, message: 'Ok' };
  }

  /**
   * Get an entity document by using id
   */
  @Get(':id')
  @ApiOperation({ summary: `Find ${entity} using id` })
  @ResponseGetOne(Product)
  async findById(
    @Owner() owner: OwnerDto,
    @Param('id') id: string,
    @Query() query: ApiQueryGetById,
  ) {
    const { error, data } = await this.productService.findById({
      owner,
      action: 'findById',
      id,
      payload: { ...query },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException('Record not found');
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }
    return { data: { [entity]: data }, message: 'Ok' };
  }

  /**
   * Delete an entity document by using id
   */
  @Delete(':id')
  @ApiOperation({ summary: `Delete ${entity} using id` })
  @ResponseDeleted(Product)
  async delete(
    @Owner() owner: OwnerDto,
    @Param('id') id: string,
    @Query() query: ApiQueryDelete,
  ) {
    const { error, data } = await this.productService.delete({
      owner,
      action: 'delete',
      id,
      payload: { ...query },
    });

    if (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException('Record not found');
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : error,
      );
    }
    return { data: { [entity]: data }, message: 'Deleted' };
  }
}
