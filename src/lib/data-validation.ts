/**
 * Data validation utilities
 */

/**
 * Validate email format
 * @param email - The email string to validate
 * @returns boolean indicating if the email is valid
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 * @param url - The URL string to validate
 * @returns boolean indicating if the URL is valid
 */
export function isValidURL(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number format
 * @param phone - The phone number string to validate
 * @returns boolean indicating if the phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') {
    return false;
  }

  // Simple phone validation - allows numbers, spaces, dashes, parentheses, and plus signs
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanedPhone);
}

/**
 * Validate required field
 * @param value - The value to validate
 * @returns boolean indicating if the value is not empty
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

/**
 * Validate string length
 * @param value - The string to validate
 * @param minLength - Minimum length (optional)
 * @param maxLength - Maximum length (optional)
 * @returns boolean indicating if the string length is valid
 */
export function isValidStringLength(value: string, minLength?: number, maxLength?: number): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  if (minLength !== undefined && value.length < minLength) {
    return false;
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return false;
  }

  return true;
}

/**
 * Validate number range
 * @param value - The number to validate
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @returns boolean indicating if the number is within range
 */
export function isValidNumberRange(value: number, min?: number, max?: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }

  if (min !== undefined && value < min) {
    return false;
  }

  if (max !== undefined && value > max) {
    return false;
  }

  return true;
}

/**
 * Validate date format
 * @param date - The date string to validate
 * @returns boolean indicating if the date is valid
 */
export function isValidDate(date: string): boolean {
  if (typeof date !== 'string') {
    return false;
  }

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validate if value is a valid number
 * @param value - The value to validate
 * @returns boolean indicating if the value is a valid number
 */
export function isValidNumber(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'number') {
    return !isNaN(value);
  }

  if (typeof value === 'string') {
    return !isNaN(Number(value)) && !isNaN(parseFloat(value));
  }

  return false;
}

/**
 * Validate an object against a schema
 * @param obj - The object to validate
 * @param schema - The validation schema
 * @returns Validation result with valid flag and errors
 */
export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'date';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    validator?: (value: any) => boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: { field: string; message: string }[];
}

export function validateObject(obj: any, schema: ValidationSchema): ValidationResult {
  const errors: { field: string; message: string }[] = [];
  let valid = true;

  for (const field in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, field)) {
      const value = obj[field];
      const rules = schema[field];

      // Check if field is required
      if (rules.required && !isRequired(value)) {
        errors.push({ field, message: `${field} is required` });
        valid = false;
        continue; // Skip other validations if required check fails
      }

      // Skip other validations if value is not required and is empty
      if (!rules.required && !isRequired(value)) {
        continue;
      }

      // Type validation
      if (rules.type) {
        let typeValid = true;

        switch (rules.type) {
          case 'string':
            typeValid = typeof value === 'string';
            break;
          case 'number':
            typeValid = isValidNumber(value);
            break;
          case 'boolean':
            typeValid = typeof value === 'boolean';
            break;
          case 'array':
            typeValid = Array.isArray(value);
            break;
          case 'object':
            typeValid = typeof value === 'object' && value !== null && !Array.isArray(value);
            break;
          case 'email':
            typeValid = isValidEmail(value);
            break;
          case 'url':
            typeValid = isValidURL(value);
            break;
          case 'date':
            typeValid = isValidDate(value);
            break;
        }

        if (!typeValid) {
          errors.push({ field, message: `${field} must be of type ${rules.type}` });
          valid = false;
        }
      }

      // Additional validations based on type
      if (typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push({ field, message: `${field} must be at least ${rules.minLength} characters long` });
          valid = false;
        }

        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push({ field, message: `${field} must be no more than ${rules.maxLength} characters long` });
          valid = false;
        }
      } else if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({ field, message: `${field} must be at least ${rules.min}` });
          valid = false;
        }

        if (rules.max !== undefined && value > rules.max) {
          errors.push({ field, message: `${field} must be no more than ${rules.max}` });
          valid = false;
        }
      }

      // Custom validator
      if (rules.validator && typeof rules.validator === 'function') {
        if (!rules.validator(value)) {
          errors.push({ field, message: `${field} is invalid` });
          valid = false;
        }
      }
    }
  }

  return { valid, errors };
}

/**
 * Sanitize and validate user input
 * @param input - The input to sanitize and validate
 * @returns Sanitized and validated input
 */
export function sanitizeAndValidateInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters (except common whitespace)
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Basic XSS prevention - remove potential script tags (case insensitive)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/onload=/gi, '');
  sanitized = sanitized.replace(/onerror=/gi, '');

  return sanitized;
}