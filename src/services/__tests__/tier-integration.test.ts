import { TierValidationService } from '../TierValidationService';
import { ProductService } from '../ProductService';
import { CategoryService } from '../CategoryService';

describe('Tier Integration Tests', () => {
  let tierValidationService: TierValidationService;
  let productService: ProductService;
  let categoryService: CategoryService;

  beforeEach(() => {
    tierValidationService = new TierValidationService();
    productService = new ProductService();
    categoryService = new CategoryService();
  });

  test('TierValidationService should be instantiated', () => {
    expect(tierValidationService).toBeInstanceOf(TierValidationService);
  });

  test('ProductService should be instantiated with TierValidationService', () => {
    expect(productService).toBeInstanceOf(ProductService);
  });

  test('CategoryService should be instantiated with TierValidationService', () => {
    expect(categoryService).toBeInstanceOf(CategoryService);
  });

  test('TierValidationService should have required methods', () => {
    expect(typeof tierValidationService.validateProductCreation).toBe('function');
    expect(typeof tierValidationService.validateCategoryCreation).toBe('function');
    expect(typeof tierValidationService.getUserTierStatus).toBe('function');
    expect(typeof tierValidationService.trackFeatureUsage).toBe('function');
  });
});
