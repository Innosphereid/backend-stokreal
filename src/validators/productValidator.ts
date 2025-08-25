import { CreateProductRequest, UpdateProductRequest } from '@/models/ProductModel';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: Partial<CreateProductRequest | UpdateProductRequest>;
}

export class ProductValidator {
  /**
   * Validate product creation request
   */
  static validateCreate(data: Partial<CreateProductRequest>): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('Product name is required and must be at least 2 characters.');
    }
    if (!data.unit || typeof data.unit !== 'string' || data.unit.trim().length < 1) {
      errors.push('Unit is required and must be a non-empty string.');
    }
    if (
      data.selling_price === undefined ||
      typeof data.selling_price !== 'number' ||
      isNaN(data.selling_price)
    ) {
      errors.push('Selling price is required and must be a number.');
    }
    if (
      data.current_stock === undefined ||
      typeof data.current_stock !== 'number' ||
      isNaN(data.current_stock)
    ) {
      errors.push('Current stock is required and must be a number.');
    }

    // Optional fields
    if (data.description && typeof data.description !== 'string') {
      errors.push('Description must be a string.');
    }
    if (
      data.cost_price !== undefined &&
      (typeof data.cost_price !== 'number' || isNaN(data.cost_price))
    ) {
      errors.push('Cost price must be a number.');
    }
    if (data.barcode && typeof data.barcode !== 'string') {
      errors.push('Barcode must be a string.');
    }
    if (data.category_id && typeof data.category_id !== 'string') {
      errors.push('Category ID must be a string.');
    }
    if (data.search_tags && !Array.isArray(data.search_tags)) {
      errors.push('Search tags must be an array of strings.');
    }
    if (
      data.minimum_stock !== undefined &&
      (typeof data.minimum_stock !== 'number' || isNaN(data.minimum_stock))
    ) {
      errors.push('Minimum stock must be a number.');
    }

    // If there are errors, return them
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }

    // Sanitize and return valid data
    const sanitizedData = this.sanitizeProductData(data);
    return {
      isValid: true,
      errors: [],
      sanitizedData,
    };
  }

  /**
   * Validate product update request
   */
  static validateUpdate(data: Partial<UpdateProductRequest>): ValidationResult {
    const errors: string[] = [];
    // Only validate fields if present
    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length < 2)) {
      errors.push('Product name must be at least 2 characters.');
    }
    if (data.unit !== undefined && (typeof data.unit !== 'string' || data.unit.trim().length < 1)) {
      errors.push('Unit must be a non-empty string.');
    }
    if (
      data.selling_price !== undefined &&
      (typeof data.selling_price !== 'number' || isNaN(data.selling_price))
    ) {
      errors.push('Selling price must be a number.');
    }
    if (
      data.current_stock !== undefined &&
      (typeof data.current_stock !== 'number' || isNaN(data.current_stock))
    ) {
      errors.push('Current stock must be a number.');
    }
    if (data.description !== undefined && typeof data.description !== 'string') {
      errors.push('Description must be a string.');
    }
    if (
      data.cost_price !== undefined &&
      (typeof data.cost_price !== 'number' || isNaN(data.cost_price))
    ) {
      errors.push('Cost price must be a number.');
    }
    if (data.barcode !== undefined && typeof data.barcode !== 'string') {
      errors.push('Barcode must be a string.');
    }
    if (data.category_id !== undefined && typeof data.category_id !== 'string') {
      errors.push('Category ID must be a string.');
    }
    if (data.search_tags !== undefined && !Array.isArray(data.search_tags)) {
      errors.push('Search tags must be an array of strings.');
    }
    if (
      data.minimum_stock !== undefined &&
      (typeof data.minimum_stock !== 'number' || isNaN(data.minimum_stock))
    ) {
      errors.push('Minimum stock must be a number.');
    }
    // If there are errors, return them
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }
    // Sanitize and return valid data
    const sanitizedData = this.sanitizeProductData(data);
    return {
      isValid: true,
      errors: [],
      sanitizedData,
    };
  }

  /**
   * Sanitize product data
   */
  static sanitizeProductData<T extends Partial<CreateProductRequest | UpdateProductRequest>>(
    data: T
  ): T {
    const sanitized = { ...data } as T;

    if (sanitized.name && typeof sanitized.name === 'string') {
      sanitized.name = sanitized.name.trim();
    }
    if (sanitized.unit && typeof sanitized.unit === 'string') {
      sanitized.unit = sanitized.unit.trim();
    }
    if (sanitized.description && typeof sanitized.description === 'string') {
      sanitized.description = sanitized.description.trim();
    }
    if (sanitized.barcode && typeof sanitized.barcode === 'string') {
      sanitized.barcode = sanitized.barcode.trim();
    }
    if (sanitized.category_id && typeof sanitized.category_id === 'string') {
      sanitized.category_id = sanitized.category_id.trim();
    }
    if (sanitized.search_tags && Array.isArray(sanitized.search_tags)) {
      sanitized.search_tags = sanitized.search_tags.map((tag: string) =>
        typeof tag === 'string' ? tag.trim() : tag
      );
    }

    return sanitized;
  }
}
