import { CachingService } from '@core/modules/caching/caching.service';
import { addDays, snakeCase } from '@core/utils';
import { NotFoundError } from '@core/utils/error';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { History } from '@shared/modules/history/entities/history.entity';
import { Trash } from '@shared/modules/trash/entities/trash.entity';
import { Connection } from 'mongoose';
import { Attributes, ModelStatic, ScopeOptions, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import type { SqlModelOption } from './sql.module';
import {
  Scope,
  SqlCountResponse,
  SqlCreateBulkResponse,
  SqlCreateResponse,
  SqlDeleteResponse,
  SqlGetAllResponse,
  SqlGetOneResponse,
  SqlJob,
  SqlResponse,
  SqlUpdateResponse,
} from './utils/job';
import { SqlSchema } from './utils/schema';

export function getScopes<M extends SqlSchema>(
  scope: Scope,
  job: SqlJob<M>,
): (string | ScopeOptions)[] {
  return scope.map((s: string | [string, ...unknown[]]) => ({
    method: [...(Array.isArray(s) ? s : ([s] as [string])), job],
  })) as (string | ScopeOptions)[];
}

@Injectable()
export class SqlService<M extends SqlSchema> {
  private readonly model: ModelStatic<M>;

  constructor(
    @Inject('MODEL_NAME') private readonly modelName: string,
    @Inject('MODEL_OPTIONS') private readonly options: SqlModelOption,
    private readonly sequelize: Sequelize,
    @InjectConnection() private readonly connection: Connection,
    private readonly cachingService: CachingService,
    private readonly _config: ConfigService,
  ) {
    this.model = this.sequelize.models[modelName] as ModelStatic<M>;
  }

  // =========================================================================
  // Private Helper Methods
  // =========================================================================

  private addToHistory(history: Partial<History>): void {
    this.connection.models.History.create({
      entity: this.modelName,
      expire_in: this.options.historyExpireIn
        ? addDays(this.options.historyExpireIn)
        : null,
      ...history,
    }).catch((err) => {
      console.error('Error creating history record', err);
    });
  }

  private addToTrash(trash: Partial<Trash>): void {
    this.connection.models.Trash.create({
      entity: this.modelName,
      expire_in: this.options.trashExpireIn
        ? addDays(this.options.trashExpireIn)
        : null,
      ...trash,
    }).catch((err) => {
      console.error('Error creating trash record', err);
    });
  }

  private async clearCache(): Promise<void> {
    const tags = this.options.cacheTags || [snakeCase(this.modelName)];
    for (const tag of tags) {
      await this.cachingService.clearTag(tag);
    }
  }

  // =========================================================================
  // Create Operations
  // =========================================================================

  async createRecord(job: SqlJob<M>): Promise<SqlCreateResponse<M>> {
    try {
      const { body, owner, options = {}, history = true } = job;
      if (typeof body === 'undefined') {
        return { error: 'Error calling createRecord - body is missing' };
      }

      const { include, attributes } = options;
      const data = this.model.build(body, { include });

      if (owner?.id) {
        data.setDataValue('created_by', owner.id);
        data.setDataValue('updated_by', owner.id);
      }

      await data.save(options);

      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data.getDataValue('id') as number,
          action: 'create',
          created: true,
          data: data.toJSON<M>(),
          created_by: owner?.id,
        });
      }

      if (this.options.cache) {
        await this.clearCache();
      }

      if (include || attributes) {
        const dataWithInclude = await this.model.findByPk(
          data.getDataValue('id') as number,
          { include, attributes },
        );
        return { data: dataWithInclude! };
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  async createBulkRecords(job: SqlJob<M>): Promise<SqlCreateBulkResponse<M>> {
    try {
      const { records = [], owner, options = {}, history = true } = job;

      if (!records.length) {
        return {
          error: 'Error calling createBulkRecord - records are missing',
        };
      }

      const data = await this.model.bulkCreate(
        records.map((record) => ({
          ...record,
          created_by: owner?.id,
          updated_by: owner?.id,
        })),
        options,
      );

      if (this.options.history && history) {
        data.forEach((item) => {
          this.addToHistory({
            entity_id: item.getDataValue('id') as number,
            action: 'create',
            created: true,
            data: item.toJSON<M>(),
            created_by: owner?.id,
          });
        });
      }

      if (this.options.cache) {
        await this.clearCache();
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Update Operations
  // =========================================================================

  async updateRecord(job: SqlJob<M>): Promise<SqlUpdateResponse<M>> {
    try {
      const {
        id,
        body = {},
        owner,
        pk = 'id',
        options = {},
        history = true,
      } = job;

      if (!id) return { error: 'Error calling updateRecord - id is missing' };
      if (typeof body === 'undefined') {
        return { error: 'Error calling updateRecord - body is missing' };
      }

      const {
        where = {},
        include,
        attributes,
        ignoreNotFound = false,
      } = options;

      const data = await this.model.findOne({
        ...options,
        where: { ...where, [pk]: id },
      });

      if (data === null) {
        if (!ignoreNotFound) throw new NotFoundError('Record not found');
        return { data: null };
      }

      const previousData = data.toJSON<M>();

      for (const prop in body) {
        data.setDataValue(prop, body[prop]);
      }

      if (owner?.id) {
        data.setDataValue('updated_by', owner.id);
      }

      await data.save(options);

      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data.getDataValue('id') as number,
          action: 'update',
          data: data.toJSON<M>(),
          previous_data: previousData,
          created_by: owner?.id,
        });
      }

      if (this.options.cache) {
        await this.clearCache();
      }

      if (include || attributes) {
        const dataWithInclude = await this.model.findByPk(
          data.getDataValue('id') as number,
          { include, attributes },
        );
        return { data: dataWithInclude!, previousData };
      }

      return { data, previousData };
    } catch (error) {
      return { error };
    }
  }

  async findAndUpdateRecord(job: SqlJob<M>): Promise<SqlUpdateResponse<M>> {
    try {
      const { body, owner, options = {}, history = true } = job;

      if (typeof body === 'undefined') {
        return { error: 'Error calling findAndUpdateRecord - body is missing' };
      }
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling findAndUpdateRecord - options.where is missing',
        };
      }

      const { ignoreNotFound = false } = options;

      const data = await this.model.findOne({
        ...options,
      });

      if (data === null) {
        if (!ignoreNotFound) throw new NotFoundError('Record not found');
        return { data: null };
      }

      const previousData = data.toJSON<M>();

      for (const prop in body) {
        data.setDataValue(prop as keyof M, body[prop]);
      }

      if (owner?.id) {
        data.setDataValue('updated_by', owner.id);
      }

      await data.save(options);

      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data.getDataValue('id') as number,
          action: 'update',
          data: data.toJSON<M>(),
          previous_data: previousData,
          created_by: owner?.id,
        });
      }

      if (this.options.cache) {
        await this.clearCache();
      }

      return { data, previousData };
    } catch (error) {
      return { error };
    }
  }

  async updateBulkRecords(job: SqlJob<M>): Promise<SqlResponse> {
    try {
      const { body, owner, options = {} } = job;

      if (typeof body === 'undefined') {
        return { error: 'Error calling updateBulkRecords - body is missing' };
      }
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling updateBulkRecords - options.where is missing',
        };
      }

      const updateData: Record<string, unknown> = { ...body };
      if (owner?.id) {
        updateData.updated_by = owner.id;
      }

      const { where = {} } = options;

      const [affectedCount] = await this.model.update(updateData, {
        ...options,
        where,
      });

      if (this.options.cache) {
        await this.clearCache();
      }

      return { data: { affectedCount } };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Read Operations
  // =========================================================================

  async getAllRecords(job: SqlJob<M>): Promise<SqlGetAllResponse<M>> {
    try {
      const { options = {} } = job;
      const { scope = [], unscoped = false, pagination = false } = options;

      let limit = options.limit;
      if (!limit) {
        limit = this._config.get('paginationLimit');
      } else if (Number(limit) === -1) {
        limit = this._config.get('paginationMaxLimit');
      }
      options.limit = Number(limit);

      const offset = options.offset || 0;
      options.offset = Number(offset);

      const scopedModel = unscoped
        ? this.model.unscoped()
        : scope.length > 0
          ? this.model.scope(getScopes(scope, job))
          : this.model;

      if (pagination) {
        const { rows, count } = await scopedModel.findAndCountAll(options);
        return {
          data: rows,
          offset: Number(offset),
          limit: Number(limit),
          count,
        };
      } else {
        const data = await scopedModel.findAll(options);
        return { data };
      }
    } catch (error) {
      return { error };
    }
  }

  async countAllRecords(job: SqlJob<M>): Promise<SqlCountResponse> {
    try {
      const { options = {} } = job;
      const { scope = [], unscoped = false } = options;

      const scopedModel = unscoped
        ? this.model.unscoped()
        : scope.length > 0
          ? this.model.scope(getScopes(scope, job))
          : this.model;

      const data = await scopedModel.count(options);
      return { count: data };
    } catch (error) {
      return { error };
    }
  }

  async findRecordById(job: SqlJob<M>): Promise<SqlGetOneResponse<M>> {
    try {
      const { id, pk = 'id', options = {} } = job;

      if (!id) return { error: 'Error calling findRecordById - id is missing' };

      const { where = {}, allowEmpty, scope = [], unscoped = false } = options;

      const scopedModel = unscoped
        ? this.model.unscoped()
        : scope.length > 0
          ? this.model.scope(getScopes(scope, job))
          : this.model;

      const data = await scopedModel.findOne({
        ...options,
        where: { ...where, [pk]: id },
      });

      if (data === null && !allowEmpty) {
        throw new NotFoundError('Record not found');
      }

      return { data: data! };
    } catch (error) {
      return { error };
    }
  }

  async findOneRecord(job: SqlJob<M>): Promise<SqlGetOneResponse<M>> {
    try {
      const { options = {} } = job;

      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling findOneRecord - options.where is missing',
        };
      }

      const { allowEmpty, scope = [], unscoped = false } = options;

      const scopedModel = unscoped
        ? this.model.unscoped()
        : scope.length > 0
          ? this.model.scope(getScopes(scope, job))
          : this.model;

      const data = await scopedModel.findOne(options);

      if (data === null && !allowEmpty) {
        throw new NotFoundError('Record not found');
      }

      return { data: data! };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Delete Operations
  // =========================================================================

  async deleteRecord(job: SqlJob<M>): Promise<SqlDeleteResponse<M>> {
    try {
      const { id, pk = 'id', options = {}, owner } = job;

      if (!id) return { error: 'Error calling deleteRecord - id is missing' };

      const { where = {}, force = false } = options;

      const data = await this.model.findOne({
        ...options,
        where: { ...where, [pk]: id } as WhereOptions<Attributes<M>>,
        paranoid: !force,
      });

      if (data === null) throw new NotFoundError('Record not found');

      if (owner?.id) {
        data.setDataValue('updated_by', owner.id);
        data.setDataValue('deleted_by', owner.id);
      }

      await data.destroy({
        ...options,
        force,
      });

      // Soft delete: History vs Trash logic
      // If force delete -> Add to trash
      // If soft delete -> Add to history
      if (force) {
        this.addToTrash({
          entity_id: data.getDataValue('id') as number,
          data: data.toJSON<M>(),
          created_by: owner?.id,
        });
      } else if (this.options.history) {
        this.addToHistory({
          entity_id: data.getDataValue('id') as number,
          action: 'delete',
          data: data.toJSON<M>(),
          created_by: owner?.id,
        });
      }

      if (this.options.cache) {
        await this.clearCache();
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  async findAndDeleteRecord(job: SqlJob<M>): Promise<SqlDeleteResponse<M>> {
    try {
      const { options = {}, owner } = job;

      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling findAndDeleteRecord - options.where is missing',
        };
      }

      const { force = false } = options;

      const data = await this.model.findOne({
        ...options,
        paranoid: !force,
      });

      if (data === null) throw new NotFoundError('Record not found');

      if (owner?.id) {
        data.setDataValue('updated_by', owner.id);
        data.setDataValue('deleted_by', owner.id);
      }

      await data.destroy(options);

      if (force) {
        this.addToTrash({
          entity_id: data.getDataValue('id') as number,
          data: data.toJSON<M>(),
          created_by: owner?.id,
        });
      } else if (this.options.history) {
        this.addToHistory({
          entity_id: data.getDataValue('id') as number,
          action: 'delete',
          data: data.toJSON<M>(),
          created_by: owner?.id,
        });
      }

      if (this.options.cache) {
        await this.clearCache();
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  async deleteBulkRecords(job: SqlJob<M>): Promise<SqlResponse> {
    try {
      const { options = {} } = job;

      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling deleteBulkRecords - options.where is missing',
        };
      }

      const count = await this.model.destroy(options);

      if (this.options.cache) {
        await this.clearCache();
      }

      return { data: { count } };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Restore Operations
  // =========================================================================

  async restoreRecord(job: SqlJob<M>): Promise<SqlGetOneResponse<M>> {
    try {
      const { id, options = {}, owner } = job;

      if (!id) return { error: 'Error calling restoreRecord - id is missing' };

      const data = await this.model.findByPk(id, {
        paranoid: false,
      });

      if (data === null) throw new NotFoundError('Record not found');

      if (owner?.id) {
        data.setDataValue('updated_by', owner.id);
        data.setDataValue('deleted_by', null);
      }

      await data.restore(options);

      if (this.options.history) {
        this.addToHistory({
          entity_id: data.getDataValue('id') as number,
          action: 'restore',
          data: data.toJSON<M>(),
          created_by: owner?.id,
        });
      }

      if (this.options.cache) {
        await this.clearCache();
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Upsert Operations
  // =========================================================================

  async findOrCreate(job: SqlJob<M>): Promise<SqlCreateResponse<M>> {
    try {
      const { body, options = {}, history = true, owner } = job;

      if (typeof body === 'undefined') {
        return { error: 'Error calling findOrCreate - body is missing' };
      }
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling findOrCreate - options.where is missing',
        };
      }

      let data: M | null = await this.model.findOne(options);
      let created = false;

      if (!data) {
        // Build new instance
        data = this.model.build(body);
        created = true;
      }

      if (created) {
        for (const prop in body) {
          data.setDataValue(prop as keyof M, body[prop]);
        }

        if (owner?.id) {
          data.setDataValue('created_by', owner.id);
          data.setDataValue('updated_by', owner.id);
        }

        await data.save(options);

        if (this.options.history && history) {
          this.addToHistory({
            entity_id: data.getDataValue('id') as number,
            action: 'create',
            created,
            data: data.toJSON<M>(),
            created_by: owner?.id,
          });
        }

        if (this.options.cache) {
          await this.clearCache();
        }

        const { include, attributes } = options;
        if (include || attributes) {
          const dataWithInclude = await this.model.findByPk(
            data.getDataValue('id') as number,
            { include, attributes },
          );
          return { data: dataWithInclude!, created };
        }
      }

      return { data, created };
    } catch (error) {
      return { error };
    }
  }

  async createOrUpdate(job: SqlJob<M>): Promise<SqlCreateResponse<M>> {
    try {
      const { body, options = {}, history = true, owner } = job;

      if (typeof body === 'undefined') {
        return { error: 'Error calling createOrUpdate - body is missing' };
      }
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling createOrUpdate - options.where is missing',
        };
      }

      let data: M | null = await this.model.findOne(options);
      const created = !data;

      if (!data) {
        data = this.model.build(body);
      }

      const previousData = created ? null : data.toJSON<M>();

      for (const prop in body) {
        data.setDataValue(prop as keyof M, body[prop]);
      }

      if (owner?.id) {
        if (created) {
          data.setDataValue('created_by', owner.id);
        }
        data.setDataValue('updated_by', owner.id);
      }

      await data.save(options);

      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data.getDataValue('id') as number,
          action: created ? 'create' : 'update',
          created,
          data: data.toJSON<M>(),
          previous_data: previousData,
          created_by: owner?.id,
        });
      }

      if (this.options.cache) {
        await this.clearCache();
      }

      return { data, created };
    } catch (error) {
      return { error };
    }
  }
}
