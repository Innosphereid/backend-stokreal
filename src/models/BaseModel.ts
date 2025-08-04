import { db } from '@/config/database';
import { Knex } from 'knex';
import { DatabaseRecord, QueryParams } from '@/types';

export abstract class BaseModel<T extends DatabaseRecord> {
  protected abstract tableName: string;
  protected db: Knex;

  constructor() {
    this.db = db;
  }

  /**
   * Find a record by ID
   */
  async findById(id: number): Promise<T | null> {
    const record = await this.db(this.tableName).where({ id }).first();
    return record || null;
  }

  /**
   * Find all records with optional query parameters
   */
  async findAll(queryParams?: QueryParams): Promise<{ data: T[]; total: number }> {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc', search } = queryParams || {};

    let query = this.db(this.tableName).select('*');

    // Apply search if implemented by child class
    if (search) {
      query = this.applySearch(query, search);
    }

    // Get total count for pagination
    const totalQuery = query.clone();
    const [result] = await totalQuery.count('* as count');
    const total = parseInt((result?.count as string) || '0', 10);

    // Apply pagination and sorting
    const offset = (page - 1) * limit;
    const data = await query.orderBy(sort, order).limit(limit).offset(offset);

    return { data, total };
  }

  /**
   * Create a new record
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const [record] = await this.db(this.tableName)
      .insert({
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return record;
  }

  /**
   * Update a record by ID
   */
  async update(id: number, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T | null> {
    const [record] = await this.db(this.tableName)
      .where({ id })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    return record || null;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: number): Promise<boolean> {
    const deletedRows = await this.db(this.tableName).where({ id }).del();
    return deletedRows > 0;
  }

  /**
   * Find records by specific criteria
   */
  async findBy(criteria: Partial<T>): Promise<T[]> {
    return await this.db(this.tableName).where(criteria);
  }

  /**
   * Find first record by specific criteria
   */
  async findOneBy(criteria: Partial<T>): Promise<T | null> {
    const record = await this.db(this.tableName).where(criteria).first();
    return record || null;
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: number): Promise<boolean> {
    const record = await this.db(this.tableName).where({ id }).first();
    return !!record;
  }

  /**
   * Count records with optional criteria
   */
  async count(criteria?: Partial<T>): Promise<number> {
    let query = this.db(this.tableName);

    if (criteria) {
      query = query.where(criteria);
    }

    const [result] = await query.count('* as count');
    return parseInt((result?.count as string) || '0', 10);
  }

  /**
   * Execute a raw query
   */
  async raw(query: string, bindings?: readonly unknown[]): Promise<unknown> {
    if (bindings) {
      return await this.db.raw(query, bindings);
    }
    return await this.db.raw(query);
  }

  /**
   * Begin a database transaction
   */
  async transaction<R>(callback: (trx: Knex.Transaction) => Promise<R>): Promise<R> {
    return await this.db.transaction(callback);
  }

  /**
   * Apply search functionality - default implementation searches in 'name' field
   * Child classes should override this method for entity-specific search
   */
  protected applySearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    // Default implementation - searches in common fields if they exist
    // Child classes should override this for specific search logic
    return query.where(builder => {
      // Try to search in common text fields that might exist
      const searchTerm = `%${search}%`;
      builder
        .whereRaw('CAST(id AS TEXT) ILIKE ?', [searchTerm])
        .orWhereRaw('created_at::TEXT ILIKE ?', [searchTerm])
        .orWhereRaw('updated_at::TEXT ILIKE ?', [searchTerm]);
    });
  }

  /**
   * Get the table name
   */
  getTableName(): string {
    return this.tableName;
  }

  /**
   * Get the database instance
   */
  getDb(): Knex {
    return this.db;
  }
}
