import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { PostService } from '@/services/PostService';
import { CreatePostRequest, UpdatePostRequest, QueryParams } from '@/types';

export class PostController {
  private postService: PostService;

  constructor() {
    this.postService = new PostService();
  }

  // Get all posts with pagination
  getPosts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const queryParams: QueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: (req.query.sort as string) || 'created_at',
      order: (req.query.order as 'asc' | 'desc') || 'desc',
      search: req.query.search as string,
    };

    const result = await this.postService.getPosts(queryParams);
    res.status(200).json(result);
  });

  // Get post by ID
  getPostById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('Post ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      const errorResponse = createErrorResponse('Invalid post ID');
      res.status(400).json(errorResponse);
      return;
    }

    const post = await this.postService.getPostById(postId);

    if (!post) {
      const errorResponse = createErrorResponse('Post not found');
      res.status(404).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('Post retrieved successfully', post);
    res.status(200).json(response);
  });

  // Create new post
  createPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const postData: CreatePostRequest = req.body;
    const post = await this.postService.createPost(postData);
    const response = createSuccessResponse('Post created successfully', post);
    res.status(201).json(response);
  });

  // Update post
  updatePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData: UpdatePostRequest = req.body;

    if (!id) {
      const errorResponse = createErrorResponse('Post ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      const errorResponse = createErrorResponse('Invalid post ID');
      res.status(400).json(errorResponse);
      return;
    }

    const post = await this.postService.updatePost(postId, updateData);

    if (!post) {
      const errorResponse = createErrorResponse('Post not found');
      res.status(404).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('Post updated successfully', post);
    res.status(200).json(response);
  });

  // Delete post
  deletePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('Post ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      const errorResponse = createErrorResponse('Invalid post ID');
      res.status(400).json(errorResponse);
      return;
    }

    const deleted = await this.postService.deletePost(postId);

    if (!deleted) {
      const errorResponse = createErrorResponse('Post not found');
      res.status(404).json(errorResponse);
      return;
    }

    const response = createSuccessResponse('Post deleted successfully');
    res.status(200).json(response);
  });

  // Get posts by author
  getPostsByAuthor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { authorId } = req.params;

    if (!authorId) {
      const errorResponse = createErrorResponse('Author ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const authorIdNum = parseInt(authorId, 10);

    if (isNaN(authorIdNum)) {
      const errorResponse = createErrorResponse('Invalid author ID');
      res.status(400).json(errorResponse);
      return;
    }

    const posts = await this.postService.getPostsByAuthor(authorIdNum);
    const response = createSuccessResponse('Posts retrieved successfully', posts);
    res.status(200).json(response);
  });

  // Get published posts
  getPublishedPosts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const posts = await this.postService.getPublishedPosts();
    const response = createSuccessResponse('Published posts retrieved successfully', posts);
    res.status(200).json(response);
  });

  // Publish post
  publishPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('Post ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      const errorResponse = createErrorResponse('Invalid post ID');
      res.status(400).json(errorResponse);
      return;
    }

    const post = await this.postService.publishPost(postId);
    const response = createSuccessResponse('Post published successfully', post);
    res.status(200).json(response);
  });

  // Archive post
  archivePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      const errorResponse = createErrorResponse('Post ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      const errorResponse = createErrorResponse('Invalid post ID');
      res.status(400).json(errorResponse);
      return;
    }

    const post = await this.postService.archivePost(postId);
    const response = createSuccessResponse('Post archived successfully', post);
    res.status(200).json(response);
  });

  // Get post statistics
  getPostStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await this.postService.getPostStats();
    const response = createSuccessResponse('Post statistics retrieved successfully', stats);
    res.status(200).json(response);
  });

  // Get posts with author information
  getPostsWithAuthor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const posts = await this.postService.getPostsWithAuthor();
    const response = createSuccessResponse(
      'Posts with author information retrieved successfully',
      posts
    );
    res.status(200).json(response);
  });
}
