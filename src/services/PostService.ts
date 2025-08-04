import {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  QueryParams,
  PaginatedResponse,
} from '@/types';
import { createPaginatedResponse, calculatePaginationMeta } from '@/utils/response';
import { createError } from '@/middleware/errorHandler';
import { PostModel } from '@/models';

export class PostService {
  private postModel: PostModel;

  constructor() {
    this.postModel = new PostModel();
  }

  async getPosts(queryParams: QueryParams): Promise<PaginatedResponse<Post[]>> {
    const { data: posts, total } = await this.postModel.findAll(queryParams);
    const { page = 1, limit = 10 } = queryParams;

    const meta = calculatePaginationMeta(page, limit, total);
    return createPaginatedResponse(posts, meta, 'Posts retrieved successfully');
  }

  async getPostById(id: number): Promise<Post | null> {
    return await this.postModel.findById(id);
  }

  async createPost(postData: CreatePostRequest): Promise<Post> {
    return await this.postModel.create({
      title: postData.title,
      content: postData.content,
      author_id: postData.author_id,
      status: postData.status || 'draft',
    } as Omit<Post, 'id' | 'created_at' | 'updated_at'>);
  }

  async updatePost(id: number, updateData: UpdatePostRequest): Promise<Post | null> {
    const existingPost = await this.postModel.findById(id);
    if (!existingPost) {
      return null;
    }

    return await this.postModel.update(id, updateData);
  }

  async deletePost(id: number): Promise<boolean> {
    return await this.postModel.delete(id);
  }

  async getPostsByAuthor(authorId: number): Promise<Post[]> {
    return await this.postModel.findByAuthor(authorId);
  }

  async getPublishedPosts(): Promise<Post[]> {
    return await this.postModel.findPublished();
  }

  async publishPost(id: number): Promise<Post | null> {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw createError('Post not found', 404);
    }

    return await this.postModel.publishPost(id);
  }

  async archivePost(id: number): Promise<Post | null> {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw createError('Post not found', 404);
    }

    return await this.postModel.archivePost(id);
  }

  async getPostStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
  }> {
    return await this.postModel.getPostStats();
  }

  async getPostsWithAuthor(): Promise<
    (Post & { author_username: string; author_first_name: string; author_last_name: string })[]
  > {
    return await this.postModel.findWithAuthor();
  }
}
