import { ProfileValidator } from '../../validators/profileValidator';
import { UpdateUserRequest } from '../../types';

describe('ProfileValidator', () => {
  describe('validateProfileUpdate', () => {
    it('should validate valid profile data', () => {
      const validData: UpdateUserRequest = {
        full_name: 'John Doe',
        phone: '+6281234567890',
        whatsapp_number: '+6281234567890',
      };

      const result = ProfileValidator.validateProfileUpdate(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toBeDefined();
    });

    it('should validate valid profile data with 08 format', () => {
      const validData: UpdateUserRequest = {
        full_name: 'Jane Smith',
        phone: '081234567890',
        whatsapp_number: '081234567890',
      };

      const result = ProfileValidator.validateProfileUpdate(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toBeDefined();
    });

    it('should reject invalid full name', () => {
      const invalidData: UpdateUserRequest = {
        full_name: 'A', // Too short
      };

      const result = ProfileValidator.validateProfileUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Full name must be at least 2 characters long');
    });

    it('should reject invalid phone number', () => {
      const invalidData: UpdateUserRequest = {
        phone: '12345', // Invalid format
      };

      const result = ProfileValidator.validateProfileUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Phone number must be in valid Indonesian format (+62xxx or 08xxx)'
      );
    });

    it('should reject invalid WhatsApp number', () => {
      const invalidData: UpdateUserRequest = {
        whatsapp_number: '12345', // Invalid format
      };

      const result = ProfileValidator.validateProfileUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'WhatsApp number must be in valid Indonesian format (+62xxx or 08xxx)'
      );
    });

    it('should handle partial updates', () => {
      const partialData: UpdateUserRequest = {
        full_name: 'John Doe',
        // phone and whatsapp_number not provided
      };

      const result = ProfileValidator.validateProfileUpdate(partialData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData?.full_name).toBe('John Doe');
    });

    it('should sanitize input data', () => {
      const dataWithSpaces: UpdateUserRequest = {
        full_name: '  John   Doe  ',
        phone: ' +62 812 345 6789 ',
        whatsapp_number: ' 08 1234 5678 90 ',
      };

      const result = ProfileValidator.validateProfileUpdate(dataWithSpaces);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.full_name).toBe('John Doe');
      expect(result.sanitizedData?.phone).toBe('+628123456789');
      expect(result.sanitizedData?.whatsapp_number).toBe('081234567890');
    });

    // New tests to capture the validation inconsistency issues
    describe('Phone number validation consistency', () => {
      it('should validate +62 format with spaces correctly', () => {
        const data: UpdateUserRequest = {
          phone: '+62 812 345 6789',
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedData?.phone).toBe('+628123456789');
      });

      it('should validate 08 format with spaces correctly', () => {
        const data: UpdateUserRequest = {
          phone: '08 1234 5678 90',
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedData?.phone).toBe('081234567890');
      });

      it('should validate +62 format with dashes correctly', () => {
        const data: UpdateUserRequest = {
          phone: '+62-812-345-6789',
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedData?.phone).toBe('+628123456789');
      });

      it('should validate 08 format with dashes correctly', () => {
        const data: UpdateUserRequest = {
          phone: '08-1234-5678-90',
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedData?.phone).toBe('081234567890');
      });
    });

    describe('WhatsApp number validation consistency', () => {
      it('should validate +62 format with spaces correctly', () => {
        const data: UpdateUserRequest = {
          whatsapp_number: '+62 812 345 6789',
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedData?.whatsapp_number).toBe('+628123456789');
      });

      it('should validate 08 format with spaces correctly', () => {
        const data: UpdateUserRequest = {
          whatsapp_number: '08 1234 5678 90',
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedData?.whatsapp_number).toBe('081234567890');
      });

      it('should validate +62 format with dashes correctly', () => {
        const data: UpdateUserRequest = {
          whatsapp_number: '+62-812-345-6789',
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedData?.whatsapp_number).toBe('+628123456789');
      });

      it('should validate 08 format with dashes correctly', () => {
        const data: UpdateUserRequest = {
          whatsapp_number: '08-1234-5678-90',
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(true);
        expect(result.sanitizedData?.whatsapp_number).toBe('081234567890');
      });
    });

    describe('Edge cases and invalid formats', () => {
      it('should reject phone numbers that are too short', () => {
        const data: UpdateUserRequest = {
          phone: '+62812345', // Too short for +62 format
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          'Phone number must be in valid Indonesian format (+62xxx or 08xxx)'
        );
      });

      it('should reject phone numbers that are too long', () => {
        const data: UpdateUserRequest = {
          phone: '+628123456789012345', // Too long
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          'Phone number must be in valid Indonesian format (+62xxx or 08xxx)'
        );
      });

      it('should reject WhatsApp numbers that are too short', () => {
        const data: UpdateUserRequest = {
          whatsapp_number: '0812345', // Too short for 08 format
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          'WhatsApp number must be in valid Indonesian format (+62xxx or 08xxx)'
        );
      });

      it('should reject WhatsApp numbers that are too long', () => {
        const data: UpdateUserRequest = {
          whatsapp_number: '08123456789012345', // Too long
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          'WhatsApp number must be in valid Indonesian format (+62xxx or 08xxx)'
        );
      });

      it('should reject invalid country codes', () => {
        const data: UpdateUserRequest = {
          phone: '+618123456789', // +61 instead of +62
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          'Phone number must be in valid Indonesian format (+62xxx or 08xxx)'
        );
      });

      it('should reject invalid local prefixes', () => {
        const data: UpdateUserRequest = {
          phone: '091234567890', // 09 instead of 08
        };

        const result = ProfileValidator.validateProfileUpdate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          'Phone number must be in valid Indonesian format (+62xxx or 08xxx)'
        );
      });
    });
  });

  describe('sanitizeProfileData', () => {
    it('should sanitize string inputs', () => {
      const data: UpdateUserRequest = {
        full_name: '  John   Doe  ',
        phone: ' +62 812 345 6789 ',
        whatsapp_number: ' 08 1234 5678 90 ',
      };

      const sanitized = ProfileValidator.sanitizeProfileData(data);

      expect(sanitized.full_name).toBe('John Doe');
      expect(sanitized.phone).toBe('+628123456789');
      expect(sanitized.whatsapp_number).toBe('081234567890');
    });

    it('should handle undefined values', () => {
      const data: UpdateUserRequest = {
        full_name: 'John Doe',
        // phone and whatsapp_number are undefined
      };

      const sanitized = ProfileValidator.sanitizeProfileData(data);

      expect(sanitized.full_name).toBe('John Doe');
      expect(sanitized.phone).toBeUndefined();
      expect(sanitized.whatsapp_number).toBeUndefined();
    });
  });
});
