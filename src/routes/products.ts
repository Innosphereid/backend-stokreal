import { Router } from 'express';
import { ProductController } from '@/controllers/ProductController';
import { authenticateToken } from '@/middleware/jwtMiddleware';
import { productTierValidationMiddleware } from '@/middleware/productTierValidationMiddleware';
import { productValidationMiddleware } from '@/middleware/productValidationMiddleware';

const router = Router();
const productController = new ProductController();

// Create product
router.post(
  '/',
  authenticateToken(),
  productValidationMiddleware('create'),
  productTierValidationMiddleware({ action: 'create' }),
  productController.createProduct
);

// List products
router.get('/', authenticateToken(), productController.getProducts);

// Get product by ID
router.get('/:id', authenticateToken(), productController.getProductById);

// Update product
router.put(
  '/:id',
  authenticateToken(),
  productValidationMiddleware('update'),
  productController.updateProduct
);

// Delete product
router.delete('/:id', authenticateToken(), productController.deleteProduct);

// Search products
router.get('/search', authenticateToken(), productController.searchProducts);

// Product stats
router.get('/stats', authenticateToken(), productController.getProductStats);

// Restore product (not yet implemented)
router.post('/:id/restore', authenticateToken(), productController.restoreProduct);

// Get products by category
router.get('/category/:categoryId', authenticateToken(), productController.getProductsByCategory);

export default router;
