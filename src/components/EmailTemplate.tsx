import React from 'react';
import EmailTemplate from './EmailTemplate'; // Asegúrate de que la ruta sea correcta

const App: React.FC = () => {
  const paymentState = {
    month: 'Julio',
    amount: 100000,
    dueDate: '2025-07-15',
    projectName: 'Proyecto Gloster',
    recipient: 'Juan Pérez',
    currency: 'CLP',
  };

  const project = {
    name: 'Proyecto Gloster',
    client: 'Cliente X',
    contractor: 'Contratista Y',
    location: 'Santiago, Chile',
    projectManager: 'Pedro Gómez',
    contactEmail: 'contacto@gloster.com',
    contractorRUT: '12.345.678-9',
    contractorPhone: '987654321',
    contractorAddress: 'Av. Libertador 1234',
  };

  const documents = [
    {
      id: '1',
      name: 'Factura',
      description: 'Factura del mes de Julio',
      uploaded: true,
    },
    {
      id: '2',
      name: 'Contrato',
      description: 'Contrato firmado',
      uploaded: false,
    },
  ];

  return (
    <div className="App">
      <EmailTemplate
        paymentState={paymentState}
        project={project}
        documents={documents}
        hideActionButtons={false}
        driveUrl="https://drive.google.com/drive/folders/your-folder-id"
      />
    </div>
  );
}

export default App;