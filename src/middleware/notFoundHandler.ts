import { Request, Response } from 'express';
import { createErrorResponse } from '@/utils/response';

export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse = createErrorResponse(`Route ${req.originalUrl} not found`, 'Not Found');

  res.status(404).json(errorResponse);
};
