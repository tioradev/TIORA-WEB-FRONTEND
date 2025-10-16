// Password validation utility
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for no whitespace
  if (/\s/.test(password)) {
    errors.push('Password cannot contain spaces');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  const validation = validatePassword(password);
  
  if (password.length < 8) return 'weak';
  if (validation.errors.length <= 2) return 'medium';
  if (validation.isValid && password.length >= 12) return 'strong';
  
  return 'medium';
};

export const formatPasswordErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return `• ${errors.join('\n• ')}`;
};