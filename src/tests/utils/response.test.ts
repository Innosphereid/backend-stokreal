import { createSuccessResponse, calculatePaginationMeta } from '../../utils/response';

describe('Response Utils', () => {
  describe('createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse('Success message', data);

      expect(response.message).toBe('Success message');
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
    });

    it('should create a success response without data', () => {
      const response = createSuccessResponse('Success message');

      expect(response.message).toBe('Success message');
      expect(response.data).toBeUndefined();
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('calculatePaginationMeta', () => {
    it('should calculate pagination meta correctly', () => {
      const meta = calculatePaginationMeta(2, 10, 25);

      expect(meta.page).toBe(2);
      expect(meta.limit).toBe(10);
      expect(meta.total).toBe(25);
      expect(meta.totalPages).toBe(3);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(true);
    });

    it('should handle first page correctly', () => {
      const meta = calculatePaginationMeta(1, 10, 25);

      expect(meta.page).toBe(1);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(false);
    });

    it('should handle last page correctly', () => {
      const meta = calculatePaginationMeta(3, 10, 25);

      expect(meta.page).toBe(3);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(true);
    });

    it('should handle single page correctly', () => {
      const meta = calculatePaginationMeta(1, 10, 5);

      expect(meta.page).toBe(1);
      expect(meta.totalPages).toBe(1);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });
  });
});
