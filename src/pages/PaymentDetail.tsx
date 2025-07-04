import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, CardHeader, CardContent, CardTitle, CardDescription, Badge } from '@lovable-ui/components';
import { Save, Send, Eye, Calendar, CheckCircle, Download, ExternalLink, Upload, ArrowLeft, Clock } from 'react-icons/fa';

const PaymentDetail = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [editableAmount, setEditableAmount] = useState('');
  const [editablePercentage, setEditablePercentage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [documentStatus, setDocumentStatus] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [paymentState, setPaymentState] = useState({});
  const [payment, setPayment] = useState({});
  const [documents, setDocuments] = useState([]);
  const fileInputRefs = useRef({});
  
  // Aquí va tu lógica para obtener los documentos y estado de pago.
  
  const shouldShowDriveFiles = () => {
    return paymentState.status === 'Enviado' || paymentState.status === 'Aprobado' || paymentState.status === 'Rechazado';
  };

  const savePaymentAmount = async (paymentId, amount) => {
    // Lógica para guardar el monto en la base de datos.
    console.log(`Guardando monto: ${amount} para el pago ${paymentId}`);
  };

  const savePaymentPercentage = async (paymentId, percentage) => {
    // Lógica para guardar el porcentaje en la base de datos.
    console.log(`Guardando porcentaje: ${percentage} para el pago ${paymentId}`);
  };

  const uploadFileToDrive = async (doc) => {
    // Lógica para cargar el archivo a Google Drive.
    console.log(`Subiendo archivo ${doc.name} a Google Drive`);
  };

  const uploadDocumentsToDrive = async () => {
    if (isUploading) return; // Si ya está subiendo, no hacer nada.

    setIsUploading(true);
    try {
      for (const doc of documents) {
        if (uploadedFiles[doc.id]?.length > 0) {
          await uploadFileToDrive(doc);  // Llamar a la función de carga de Drive
        }
      }
    } catch (error) {
      console.error('Error al cargar los documentos:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const saveAmountAndPercentage = async () => {
    if (editableAmount !== paymentState.amount) {
      await savePaymentAmount(paymentState.id, editableAmount);
    }

    if (editablePercentage !== (paymentState.amount / payment.projectData.Budget) * 100) {
      await savePaymentPercentage(paymentState.id, editablePercentage);
    }
  };

  const handlePreviewEmail = async () => {
    await saveAmountAndPercentage(); // Guardar monto y porcentaje si es necesario
    await uploadDocumentsToDrive(); // Subir documentos a Drive
    openEmailPreview(); // Mostrar la vista previa del correo
  };

  const handleSendDocuments = async () => {
    await saveAmountAndPercentage(); // Guardar monto y porcentaje si es necesario
    await uploadDocumentsToDrive(); // Subir documentos a Drive
    sendDocumentsToRecipient(); // Enviar documentos
  };

  const openEmailPreview = () => {
    console.log('Abriendo vista previa del correo...');
    // Tu lógica para abrir la vista previa aquí
  };

  const sendDocumentsToRecipient = async () => {
    try {
      console.log('Enviando documentos...');
      // Lógica para enviar los documentos al destinatario
    } catch (error) {
      console.error('Error al enviar los documentos:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Header, Contenido, etc. */}
      <div className="container mx-auto px-6 py-8">
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 font-rubik">Estado de Pago y Documentación</h3>
        
        {/* Payment Info and Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-l-4 border-l-gloster-yellow hover:shadow-xl transition-all duration-300 h-full">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="h-6 w-6 text-gloster-gray" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl md:text-2xl mb-2 font-rubik text-slate-800">{paymentState.month}</CardTitle>
                      <CardDescription className="text-gloster-gray font-rubik text-sm md:text-base">
                        {paymentState.projectName}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gloster-gray/20 text-gloster-gray border-gloster-gray/30 self-start shrink-0">
                    {paymentState.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <p className="text-gloster-gray text-sm font-rubik mb-2">Monto del Estado</p>
                    {shouldShowDriveFiles() ? (
                      <p className="font-bold text-lg md:text-xl text-slate-800 font-rubik break-words">
                        {editableAmount}
                      </p>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gloster-gray">{payment?.projectData?.Currency || 'CLP'}</span>
                        <Input
                          type="number"
                          value={editableAmount}
                          onChange={(e) => setEditableAmount(e.target.value)}
                          placeholder="Ingrese monto"
                          className="w-40"
                        />
                        <Button
                          size="sm"
                          onClick={() => savePaymentAmount(paymentState.id, editableAmount)}
                          disabled={isSaving}
                          className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik mb-2">% Avance Financiero</p>
                    {shouldShowDriveFiles() ? (
                      <p className="font-semibold text-slate-800 font-rubik">
                        {payment?.projectData?.Budget ? 
                          ((paymentState.amount / payment.projectData.Budget) * 100).toFixed(2) + '%' : 
                          'N/A'
                        }
                      </p>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={editablePercentage}
                          onChange={(e) => setEditablePercentage(e.target.value)}
                          placeholder="0"
                          className="w-20"
                        />
                        <span className="text-sm text-gloster-gray">%</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik">Fecha de Vencimiento</p>
                    <p className="font-semibold text-slate-800 font-rubik">{paymentState.dueDate}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <p className="text-gloster-gray text-sm font-rubik">Destinatario</p>
                    <p className="font-semibold text-slate-800 font-rubik break-words">{paymentState.recipient}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <Card className="border-gloster-gray/20 hover:shadow-xl transition-all duration-300 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 font-rubik text-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gloster-gray">Vista Previa o Enviar</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="space-y-4">
                  <Button
                    onClick={handlePreviewEmail}
                    variant="outline"
                    className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
                    size="sm"
                    disabled={isUploading || (!areAllRequiredDocumentsUploaded() && !shouldShowDriveFiles())}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Vista Previa
                  </Button>
                  <Button
                    onClick={handleSendDocuments}
                    disabled={
                      shouldShowDriveFiles() 
                        ? !wereDocumentsUpdated() || isUploading
                        : !documents.filter(d => d.required).every(d => documentStatus[d.id]) || isUploading
                    }
                    className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {isUploading ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
