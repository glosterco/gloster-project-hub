
export const useRegistrationData = () => {
  const prepareContratistaData = (formData: any, authUserId: string) => ({
    CompanyName: formData.companyName,
    RUT: formData.rut,
    Specialization: formData.specialties.includes('Otro') 
      ? formData.customSpecialty 
      : formData.specialties.join(', '),
    Experience: formData.experience,
    Adress: '', // Campo removido del formulario pero requerido en BD
    City: '', // Campo removido del formulario pero requerido en BD
    ContactName: formData.contactName,
    ContactEmail: formData.email,
    ContactPhone: parseInt(formData.phone.replace('+56', '')),
    Username: formData.email,
    Password: formData.password,
    Status: true,
    auth_user_id: authUserId
  });

  const prepareMandanteData = (formData: any) => ({
    CompanyName: formData.clientCompany,
    ContactName: formData.clientContact,
    ContactEmail: formData.clientEmail,
    ContactPhone: parseInt(formData.clientPhone.replace('+56', '')),
    Status: true
  });

  const prepareProyectoData = (formData: any, contratistaId: number, mandanteId: number) => {
    const expiryRateString = formData.paymentPeriod === 'mensual' ? '30' : 
                            formData.paymentPeriod === 'quincenal' ? '15' : 
                            formData.customPeriod || '30';

    // Ensure "Avance del período" is always included in requirements
    let finalRequiredDocuments = [...formData.requiredDocuments];
    if (!finalRequiredDocuments.includes('Avance del período')) {
      finalRequiredDocuments.push('Avance del período');
      console.log('🔧 Auto-adding "Avance del período" to project requirements');
    }

    // Add other documents if specified
    if (formData.otherDocuments && Array.isArray(formData.otherDocuments)) {
      const otherDocs = formData.otherDocuments
        .filter((doc: string) => doc && doc.trim())
        .map((doc: string) => doc.trim());
      finalRequiredDocuments = [...finalRequiredDocuments, ...otherDocs];
    }

    console.log('📋 Final project requirements:', finalRequiredDocuments);

    return {
      Name: formData.projectName,
      Description: formData.projectDescription,
      Location: formData.projectAddress,
      Budget: parseFloat(formData.contractAmount),
      Currency: formData.contractCurrency,
      StartDate: formData.startDate,
      Duration: parseInt(formData.duration),
      Contratista: contratistaId,
      Owner: mandanteId,
      FirstPayment: formData.firstPaymentDate,
      ExpiryRate: expiryRateString,
      Requierment: finalRequiredDocuments,
    };
  };

  const getExpiryRateNumeric = (formData: any) => {
    return formData.paymentPeriod === 'mensual' ? 30 : 
           formData.paymentPeriod === 'quincenal' ? 15 : 
           parseInt(formData.customPeriod) || 30;
  };

  return {
    prepareContratistaData,
    prepareMandanteData,
    prepareProyectoData,
    getExpiryRateNumeric
  };
};
