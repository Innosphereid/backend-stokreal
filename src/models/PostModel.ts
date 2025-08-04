import { BaseModel } from './BaseModel';
import { Post } from '@/types';
import { Knex } from 'knex';

export class PostModel extends BaseModel<Post> {
  protected tableName = 'posts';

  /**
   * Apply search functionality for posts
   */
  protected applySearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    return query.where(builder => {
      builder.where('title', 'ilike', `%${search}%`).orWhere('content', 'ilike', `%${search}%`);
    });
  }

  /**
   * Find posts by author
   */
  async findByAuthor(authorId: number): Promise<Post[]> {
    return await this.findBy({ author_id: authorId } as Partial<Post>);
  }

  /**
   * Find published posts only
   */
  async findPublished(): Promise<Post[]> {
    return await this.findBy({ status: 'published' } as Partial<Post>);
  }

  /**
   * Find posts by status
   */
  async findByStatus(status: 'draft' | 'published' | 'archived'): Promise<Post[]> {
    return await this.findBy({ status } as Partial<Post>);
  }

  /**
   * Publish a post
   */
  async publishPost(id: number): Promise<Post | null> {
    return await this.update(id, {
      status: 'published',
      published_at: new Date(),
    });
  }

  /**
   * Archive a post
   */
  async archivePost(id: number): Promise<Post | null> {
    return await this.update(id, { status: 'archived' });
  }

  /**
   * Get posts with author information (example of join)
   */
  async findWithAuthor(): Promise<
    (Post & { author_username: string; author_first_name: string; author_last_name: string })[]
  > {
    return await this.db(this.tableName)
      .select([
        'posts.*',
        'users.username as author_username',
        'users.first_name as author_first_name',
        'users.last_name as author_last_name',
      ])
      .leftJoin('users', 'posts.author_id', 'users.id')
      .orderBy('posts.created_at', 'desc');
  }

  /**
   * Get post statistics
   */
  async getPostStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
  }> {
    const total = await this.count();
    const published = await this.count({ status: 'published' } as Partial<Post>);
    const draft = await this.count({ status: 'draft' } as Partial<Post>);
    const archived = await this.count({ status: 'archived' } as Partial<Post>);

    return {
      total,
      published,
      draft,
      archived,
    };
  }
}
