
import { useState } from 'react';
import { validateRut, validateEmail, validatePhone, validatePassword, validateNumber } from '@/components/registration/validationUtils';

export const useFormValidation = () => {
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateField = (fieldName: string, value: string, password?: string) => {
    const newErrors = { ...errors };
    
    switch (fieldName) {
      case 'rut':
        if (value && !validateRut(value)) {
          newErrors.rut = 'RUT inválido';
        } else {
          delete newErrors.rut;
        }
        break;
      case 'email':
      case 'clientEmail':
        if (value && !validateEmail(value)) {
          newErrors[fieldName] = 'Email inválido';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'phone':
      case 'clientPhone':
        if (value && !validatePhone(value)) {
          newErrors[fieldName] = 'Formato debe ser +569xxxxxxxx';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'password':
        if (value && !validatePassword(value)) {
          newErrors.password = 'Mínimo 8 caracteres alfanuméricos';
        } else {
          delete newErrors.password;
        }
        break;
      case 'confirmPassword':
        if (value && value !== password) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case 'contractAmount':
      case 'duration':
        if (value && !validateNumber(value)) {
          newErrors[fieldName] = 'Solo números permitidos';
        } else {
          delete newErrors[fieldName];
        }
        break;
    }
    
    setErrors(newErrors);
  };

  return { errors, validateField, setErrors };
};
