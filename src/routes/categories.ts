import { Router } from 'express';
import { CategoryController } from '@/controllers/CategoryController';
import { authenticateToken } from '@/middleware/jwtMiddleware';
import { productTierValidationMiddleware } from '@/middleware/productTierValidationMiddleware';
import { categoryValidationMiddleware } from '@/middleware/categoryValidationMiddleware';

const router = Router();
const categoryController = new CategoryController();

// Create category
router.post(
  '/',
  authenticateToken(),
  categoryValidationMiddleware('create'),
  productTierValidationMiddleware({ action: 'create' }),
  categoryController.createCategory
);

// List categories
router.get('/', authenticateToken(), categoryController.getCategories);

// Get category by ID
router.get('/:id', authenticateToken(), categoryController.getCategoryById);

// Update category
router.put(
  '/:id',
  authenticateToken(),
  categoryValidationMiddleware('update'),
  categoryController.updateCategory
);

// Delete category
router.delete('/:id', authenticateToken(), categoryController.deleteCategory);

// Category hierarchy
router.get('/hierarchy', authenticateToken(), categoryController.getCategoryHierarchy);

// Category stats
router.get('/stats', authenticateToken(), categoryController.getCategoryStats);

// Restore category (not yet implemented)
router.post('/:id/restore', authenticateToken(), categoryController.restoreCategory);

// Get categories by parent
router.get('/parent/:parentId', authenticateToken(), categoryController.getCategoriesByParent);

// Search categories
router.get('/search', authenticateToken(), categoryController.searchCategories);

export default router;
