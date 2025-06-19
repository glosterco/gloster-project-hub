
export const validateRut = (rut: string): boolean => {
  // Remove dots and dashes
  const cleanRut = rut.replace(/[.-]/g, '');
  
  // Check format: should be 8-9 digits + 1 verification digit (number or K)
  if (!/^\d{8,9}[0-9Kk]$/.test(cleanRut)) {
    return false;
  }

  // Extract body and verification digit
  const body = cleanRut.slice(0, -1);
  const verificationDigit = cleanRut.slice(-1).toUpperCase();

  // Calculate verification digit
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  let expectedDigit;

  if (remainder === 0) {
    expectedDigit = '0';
  } else if (remainder === 1) {
    expectedDigit = 'K';
  } else {
    expectedDigit = (11 - remainder).toString();
  }

  return verificationDigit === expectedDigit;
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
