
export const validateRut = (rut: string): boolean => {
  // Remove dots and dashes for validation
  const cleanRut = rut.replace(/[.-]/g, '');
  
  // Check format: should be 7-9 digits + 1 verification digit (number or K)
  if (!/^\d{7,9}[0-9Kk]$/.test(cleanRut)) {
    return false;
  }

  // If format is correct, return true (no need to validate the actual verification digit)
  return true;
};

export const formatRut = (rut: string): string => {
  // Remove all non-alphanumeric characters
  const cleanRut = rut.replace(/[^0-9Kk]/g, '');
  
  // If empty, return empty
  if (!cleanRut) return '';
  
  // If only one character, return as is
  if (cleanRut.length <= 1) return cleanRut;
  
  // Split into body and verification digit
  const body = cleanRut.slice(0, -1);
  const verificationDigit = cleanRut.slice(-1).toUpperCase();
  
  // Add formatting: XXXXXXXX-X
  return `${body}-${verificationDigit}`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Check if it's in the format +569xxxxxxxx (9 digits after +56)
  const phoneRegex = /^\+569\d{8}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8 && /^[a-zA-Z0-9]+$/.test(password);
};

export const validateNumber = (value: string): boolean => {
  return /^\d+$/.test(value);
};
