import { CreateCategoryRequest, UpdateCategoryRequest } from '@/models/CategoryModel';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: Partial<CreateCategoryRequest | UpdateCategoryRequest>;
}

export class CategoryValidator {
  /**
   * Validate category creation request
   */
  static validateCreate(data: Partial<CreateCategoryRequest>): ValidationResult {
    const errors: string[] = [];
    // Required fields
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('Category name is required and must be at least 2 characters.');
    }
    // Optional fields
    if (data.description && typeof data.description !== 'string') {
      errors.push('Description must be a string.');
    }
    if (data.color && typeof data.color !== 'string') {
      errors.push('Color must be a string.');
    }
    if (
      data.sort_order !== undefined &&
      (typeof data.sort_order !== 'number' || isNaN(data.sort_order))
    ) {
      errors.push('Sort order must be a number.');
    }
    if (data.parent_id && typeof data.parent_id !== 'string') {
      errors.push('Parent ID must be a string.');
    }
    // If there are errors, return them
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }
    // Sanitize and return valid data
    const sanitizedData = this.sanitizeCategoryData(data);
    return {
      isValid: true,
      errors: [],
      sanitizedData,
    };
  }

  /**
   * Validate category update request
   */
  static validateUpdate(data: Partial<UpdateCategoryRequest>): ValidationResult {
    const errors: string[] = [];
    // Only validate fields if present
    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length < 2)) {
      errors.push('Category name must be at least 2 characters.');
    }
    if (data.description !== undefined && typeof data.description !== 'string') {
      errors.push('Description must be a string.');
    }
    if (data.color !== undefined && typeof data.color !== 'string') {
      errors.push('Color must be a string.');
    }
    if (
      data.sort_order !== undefined &&
      (typeof data.sort_order !== 'number' || isNaN(data.sort_order))
    ) {
      errors.push('Sort order must be a number.');
    }
    if (data.parent_id !== undefined && typeof data.parent_id !== 'string') {
      errors.push('Parent ID must be a string.');
    }
    // If there are errors, return them
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }
    // Sanitize and return valid data
    const sanitizedData = this.sanitizeCategoryData(data);
    return {
      isValid: true,
      errors: [],
      sanitizedData,
    };
  }

  /**
   * Sanitize category data
   */
  static sanitizeCategoryData<T extends Partial<CreateCategoryRequest | UpdateCategoryRequest>>(
    data: T
  ): T {
    const sanitized = { ...data } as T;

    if (sanitized.name && typeof sanitized.name === 'string') {
      sanitized.name = sanitized.name.trim();
    }
    if (sanitized.description && typeof sanitized.description === 'string') {
      sanitized.description = sanitized.description.trim();
    }
    if (sanitized.color && typeof sanitized.color === 'string') {
      sanitized.color = sanitized.color.trim();
    }
    if (sanitized.parent_id && typeof sanitized.parent_id === 'string') {
      sanitized.parent_id = sanitized.parent_id.trim();
    }

    return sanitized;
  }
}
