/**
 * Input Sanitization & Security Utilities
 * Global security layer to prevent SQL injection, XSS, and other attacks
 */

// ============================================
// ALLOWED SPECIAL CHARACTERS FOR PASSWORDS
// ============================================
export const ALLOWED_SPECIAL_CHARS = '!@#$%^&*';
export const ALLOWED_SPECIAL_CHARS_DISPLAY = '! @ # $ % ^ & *';

// ============================================
// SQL INJECTION DETECTION PATTERNS
// ============================================
const SQL_INJECTION_PATTERNS = [
  // SQL keywords
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|DECLARE|FETCH|OPEN|CLOSE)\b)/gi,
  // SQL comments
  /(--|\/\*|\*\/|#)/g,
  // SQL operators and special syntax
  /(\bOR\b\s*\d+\s*=\s*\d+|\bAND\b\s*\d+\s*=\s*\d+)/gi,
  /(1\s*=\s*1|1\s*=\s*'1'|'1'\s*=\s*'1')/gi,
  /(\bOR\b\s*'.*'\s*=\s*'.*')/gi,
  // Hex encoding attempts
  /(0x[0-9a-fA-F]+)/g,
  // Escape sequences
  /(\\x[0-9a-fA-F]{2})/g,
  // Semicolon followed by SQL
  /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP))/gi,
  // CHAR/CHR encoding
  /(CHAR\s*\(|CHR\s*\()/gi,
];

// ============================================
// XSS (Cross-Site Scripting) DETECTION PATTERNS
// ============================================
const XSS_PATTERNS = [
  // Script tags
  /(<script|<\/script)/gi,
  // JavaScript protocol
  /(javascript\s*:)/gi,
  // Event handlers
  /(\bon\w+\s*=)/gi,
  // Data URI
  /(data\s*:\s*text\/html)/gi,
  // Expression
  /(expression\s*\()/gi,
  // VBScript
  /(vbscript\s*:)/gi,
  // Base64 data
  /(data\s*:\s*[^,]*;base64)/gi,
];

// ============================================
// COMMAND INJECTION PATTERNS
// ============================================
const COMMAND_INJECTION_PATTERNS = [
  // Shell commands
  /(\||;|`|\$\(|\$\{)/g,
  // Common dangerous commands
  /(&&|\|\||>>|<<)/g,
];

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Check if input contains potential SQL injection patterns
 */
const containsSQLInjection = (value: string): boolean => {
  if (!value) return false;
  // Reset regex lastIndex for global patterns
  SQL_INJECTION_PATTERNS.forEach(p => p.lastIndex = 0);
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
};

/**
 * Check if input contains potential XSS attack patterns
 */
const containsXSS = (value: string): boolean => {
  if (!value) return false;
  XSS_PATTERNS.forEach(p => p.lastIndex = 0);
  return XSS_PATTERNS.some(pattern => pattern.test(value));
};

/**
 * Check if input contains command injection patterns
 */
const containsCommandInjection = (value: string): boolean => {
  if (!value) return false;
  COMMAND_INJECTION_PATTERNS.forEach(p => p.lastIndex = 0);
  return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(value));
};

/**
 * Check for ANY security threat in input
 */
export const containsSecurityThreat = (value: string): boolean => {
  if (!value) return false;
  return containsSQLInjection(value) || containsXSS(value) || containsCommandInjection(value);
};

/**
 * Get security threat type if found
 */
export const getSecurityThreatType = (value: string): string | null => {
  if (!value) return null;
  if (containsSQLInjection(value)) return 'SQL Injection detected';
  if (containsXSS(value)) return 'XSS attack detected';
  if (containsCommandInjection(value)) return 'Command injection detected';
  return null;
};

// ============================================
// SANITIZATION FUNCTIONS
// ============================================

/**
 * Sanitize input by removing/encoding dangerous characters
 */
export const sanitizeInput = (value: string): string => {
  if (!value) return '';
  
  return value
    // Remove null bytes
    .replace(/\0/g, '')
    // Encode HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove SQL comment sequences
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    // Remove potential script injections
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

/**
 * Sanitize object (all string fields)
 */
export const sanitizeFormData = <T extends Record<string, unknown>>(data: T): T => {
  const sanitized = { ...data };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(sanitized[key] as string);
    }
  }
  return sanitized;
};

/**
 * Validate all form fields for security threats
 * Returns object with field names that have threats
 */
export const validateFormSecurity = (data: Record<string, unknown>): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const key in data) {
    if (typeof data[key] === 'string') {
      const threat = getSecurityThreatType(data[key] as string);
      if (threat) {
        errors[key] = 'Invalid characters detected';
      }
    }
  }
  return errors;
};

// ============================================
// PASSWORD POLICY
// ============================================

/**
 * Password Policy Configuration
 */
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  allowedSpecialChars: ALLOWED_SPECIAL_CHARS,
};

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    noSecurityThreat: boolean;
  };
}

/**
 * Validate password against policy
 */
export const validatePasswordPolicy = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  
  // Create regex for allowed special characters
  const specialCharRegex = new RegExp(`[${ALLOWED_SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
  
  const checks = {
    minLength: password.length >= PASSWORD_POLICY.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: specialCharRegex.test(password),
    noSecurityThreat: !containsSecurityThreat(password),
  };
  
  if (!checks.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
  }
  if (!checks.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!checks.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!checks.hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!checks.hasSpecialChar) {
    errors.push(`Password must contain at least one special character (${ALLOWED_SPECIAL_CHARS_DISPLAY})`);
  }
  if (!checks.noSecurityThreat) {
    errors.push('Password contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    checks,
  };
};

/**
 * Calculate password strength score (0-5)
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  const specialCharRegex = new RegExp(`[${ALLOWED_SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
  
  let strength = 0;
  
  // Length checks
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  
  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (specialCharRegex.test(password)) strength++;
  
  return strength;
};

/**
 * Get strength label and colors
 */
export const getStrengthInfo = (strength: number): { 
  label: string; 
  color: string; 
  textColor: string;
  bgClass: string;
} => {
  if (strength <= 1) return { 
    label: 'Weak', 
    color: '#ef4444', 
    textColor: 'text-red-500',
    bgClass: 'bg-red-500'
  };
  if (strength === 2) return { 
    label: 'Fair', 
    color: '#f97316', 
    textColor: 'text-orange-500',
    bgClass: 'bg-orange-500'
  };
  if (strength === 3) return { 
    label: 'Good', 
    color: '#eab308', 
    textColor: 'text-yellow-500',
    bgClass: 'bg-yellow-500'
  };
  if (strength >= 4) return { 
    label: 'Strong', 
    color: '#22c55e', 
    textColor: 'text-green-500',
    bgClass: 'bg-green-500'
  };
  return { 
    label: 'Very Strong', 
    color: '#10b981', 
    textColor: 'text-emerald-500',
    bgClass: 'bg-emerald-500'
  };
};
