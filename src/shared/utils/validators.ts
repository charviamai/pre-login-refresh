/**
 * Form Validation Utilities
 * 
 * Reusable validation functions for forms across the application.
 * Provides consistent validation patterns and error messages.
 */

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FieldValidation {
  [key: string]: ValidationResult;
}

// ============================================================================
// BASIC VALIDATORS
// ============================================================================

export const validators = {
  /**
   * Required field validation
   */
  required: (value: unknown, fieldName = 'Field'): ValidationResult => {
    const isEmpty = value === null || value === undefined || 
                    (typeof value === 'string' && value.trim() === '') ||
                    (Array.isArray(value) && value.length === 0);
    return {
      isValid: !isEmpty,
      error: isEmpty ? `${fieldName} is required` : undefined,
    };
  },

  /**
   * Email validation
   */
  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    return {
      isValid,
      error: isValid ? undefined : 'Please enter a valid email address',
    };
  },

  /**
   * Phone number validation (US format)
   */
  phone: (value: string): ValidationResult => {
    // Allow various formats: (123) 456-7890, 123-456-7890, 1234567890
    const phoneRegex = /^[\d\s\-()]+$/;
    const digitsOnly = value.replace(/\D/g, '');
    const isValid = phoneRegex.test(value) && digitsOnly.length >= 10 && digitsOnly.length <= 11;
    return {
      isValid,
      error: isValid ? undefined : 'Please enter a valid phone number',
    };
  },

  /**
   * Minimum length validation
   */
  minLength: (value: string, min: number, fieldName = 'Field'): ValidationResult => {
    const isValid = value.length >= min;
    return {
      isValid,
      error: isValid ? undefined : `${fieldName} must be at least ${min} characters`,
    };
  },

  /**
   * Maximum length validation
   */
  maxLength: (value: string, max: number, fieldName = 'Field'): ValidationResult => {
    const isValid = value.length <= max;
    return {
      isValid,
      error: isValid ? undefined : `${fieldName} must be no more than ${max} characters`,
    };
  },

  /**
   * Numeric validation
   */
  numeric: (value: string | number): ValidationResult => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const isValid = !isNaN(numValue) && isFinite(numValue);
    return {
      isValid,
      error: isValid ? undefined : 'Please enter a valid number',
    };
  },

  /**
   * Positive number validation
   */
  positive: (value: string | number, fieldName = 'Value'): ValidationResult => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const isValid = !isNaN(numValue) && numValue > 0;
    return {
      isValid,
      error: isValid ? undefined : `${fieldName} must be a positive number`,
    };
  },

  /**
   * Range validation
   */
  range: (value: number, min: number, max: number, fieldName = 'Value'): ValidationResult => {
    const isValid = value >= min && value <= max;
    return {
      isValid,
      error: isValid ? undefined : `${fieldName} must be between ${min} and ${max}`,
    };
  },

  /**
   * Date validation
   */
  date: (value: string): ValidationResult => {
    const date = new Date(value);
    const isValid = !isNaN(date.getTime());
    return {
      isValid,
      error: isValid ? undefined : 'Please enter a valid date',
    };
  },

  /**
   * Future date validation
   */
  futureDate: (value: string): ValidationResult => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isValid = !isNaN(date.getTime()) && date >= today;
    return {
      isValid,
      error: isValid ? undefined : 'Date must be today or in the future',
    };
  },

  /**
   * Time validation (HH:MM format)
   */
  time: (value: string): ValidationResult => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const isValid = timeRegex.test(value);
    return {
      isValid,
      error: isValid ? undefined : 'Please enter a valid time (HH:MM)',
    };
  },

  /**
   * URL validation
   */
  url: (value: string): ValidationResult => {
    try {
      new URL(value);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Please enter a valid URL' };
    }
  },

  /**
   * Password strength validation
   */
  password: (value: string): ValidationResult => {
    const hasMinLength = value.length >= 8;
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    
    const requirements = [];
    if (!hasMinLength) requirements.push('at least 8 characters');
    if (!hasUppercase) requirements.push('an uppercase letter');
    if (!hasLowercase) requirements.push('a lowercase letter');
    if (!hasNumber) requirements.push('a number');
    
    const isValid = requirements.length === 0;
    return {
      isValid,
      error: isValid ? undefined : `Password must contain ${requirements.join(', ')}`,
    };
  },

  /**
   * Match validation (e.g., password confirmation)
   */
  match: (value: string, matchValue: string, fieldName = 'Values'): ValidationResult => {
    const isValid = value === matchValue;
    return {
      isValid,
      error: isValid ? undefined : `${fieldName} do not match`,
    };
  },

  /**
   * Access code validation (employee 4-digit PIN)
   */
  accessCode: (value: string): ValidationResult => {
    const isValid = /^\d{4}$/.test(value);
    return {
      isValid,
      error: isValid ? undefined : 'Access code must be exactly 4 digits',
    };
  },
};

// ============================================================================
// FORM VALIDATION HELPER
// ============================================================================

/**
 * Validate multiple fields at once
 * 
 * @example
 * const errors = validateForm({
 *   email: [validators.required(email), validators.email(email)],
 *   password: [validators.required(password), validators.password(password)],
 * });
 * 
 * if (Object.keys(errors).length > 0) {
 *   setErrors(errors);
 *   return;
 * }
 */
export function validateForm(
  validations: Record<string, ValidationResult[]>
): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const [field, results] of Object.entries(validations)) {
    // Find first failing validation
    const failed = results.find(r => !r.isValid);
    if (failed && failed.error) {
      errors[field] = failed.error;
    }
  }
  
  return errors;
}

/**
 * Check if form has no errors
 */
export function isFormValid(errors: Record<string, string>): boolean {
  return Object.keys(errors).length === 0;
}

// ============================================================================
// VALIDATION HOOKS HELPER
// ============================================================================

/**
 * Create a validation function for a field that runs on blur
 */
export function createFieldValidator(
  ...validatorFns: ((value: string) => ValidationResult)[]
) {
  return (value: string): string | undefined => {
    for (const validate of validatorFns) {
      const result = validate(value);
      if (!result.isValid) {
        return result.error;
      }
    }
    return undefined;
  };
}
