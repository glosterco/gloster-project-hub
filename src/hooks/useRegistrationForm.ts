
import { useState } from 'react';

export const useRegistrationForm = () => {
  // Company Information
  const [companyName, setCompanyName] = useState('');
  const [rut, setRut] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [experience, setExperience] = useState('');

  // Contact Information
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Project Information
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [contractCurrency, setContractCurrency] = useState('CLP');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [duration, setDuration] = useState('');

  // Client Information
  const [clientCompany, setClientCompany] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Payment Information
  const [firstPaymentDate, setFirstPaymentDate] = useState<Date | undefined>(undefined);
  const [paymentPeriod, setPaymentPeriod] = useState('');
  const [customPeriod, setCustomPeriod] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([
    'Avance del período', // Pre-seleccionado
    'Comprobante de pago de cotizaciones', // Documento esencial
    'Libro de asistencia', // Documento esencial  
    'Liquidaciones de sueldo', // Documento esencial
    'Nómina de trabajadores' // Documento esencial
  ]);
  const [otherDocuments, setOtherDocuments] = useState<string[]>(['']);

  return {
    // Company Information
    companyName, setCompanyName,
    rut, setRut,
    specialties, setSpecialties,
    customSpecialty, setCustomSpecialty,
    experience, setExperience,
    
    // Contact Information
    contactName, setContactName,
    email, setEmail,
    phone, setPhone,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    
    // Project Information
    projectName, setProjectName,
    projectAddress, setProjectAddress,
    projectDescription, setProjectDescription,
    contractAmount, setContractAmount,
    contractCurrency, setContractCurrency,
    startDate, setStartDate,
    duration, setDuration,
    
    // Client Information
    clientCompany, setClientCompany,
    clientContact, setClientContact,
    clientEmail, setClientEmail,
    clientPhone, setClientPhone,
    
    // Payment Information
    firstPaymentDate, setFirstPaymentDate,
    paymentPeriod, setPaymentPeriod,
    customPeriod, setCustomPeriod,
    requiredDocuments, setRequiredDocuments,
    otherDocuments, setOtherDocuments,
  };
};
