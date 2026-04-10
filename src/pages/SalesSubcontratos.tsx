import React from "react";
import { BarChart3, FileText, Users, Shield, Clock, Camera, CheckCircle, FolderOpen, MessageSquare, AlertTriangle, TrendingUp, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SalesPresentation, { Slide } from "@/components/sales/SalesPresentation";

import dashboardImg from "@/assets/slides/subcontratos-dashboard.png";
import pagosImg from "@/assets/slides/subcontratos-estados-pago.png";
import presupuestoImg from "@/assets/slides/subcontratos-presupuesto.png";
import documentosImg from "@/assets/slides/subcontratos-documentos.png";
import fotosImg from "@/assets/slides/subcontratos-fotos.png";
import rfiImg from "@/assets/slides/subcontratos-rfi.png";
import adicionalesImg from "@/assets/slides/subcontratos-adicionales.png";

const slides: Slide[] = [
  {
    id: 0, type: "hero", title: "Gestión de", subtitle: "Subcontratos", badge: "Módulo de Subcontratos",
    description: "Controla estados de pago, documentos, presupuesto, RFI y adicionales de todos tus subcontratos en una sola plataforma. Sin planillas, sin correos perdidos.",
    layout: "center", accent: "from-primary via-primary/95 to-primary/85",
  },
  {
    id: 1, type: "feature", title: "Dashboard de proyectos",
    description: "Vista consolidada de todos tus proyectos activos con indicadores clave: presupuesto, estados de pago pendientes, documentación y avance general.",
    image: dashboardImg, layout: "right",
    features: [
      { icon: <BarChart3 className="w-5 h-5" />, label: "Indicadores en tiempo real", detail: "Presupuesto, avance y estados de pago siempre actualizados" },
      { icon: <Users className="w-5 h-5" />, label: "Multi-proyecto", detail: "Gestiona múltiples subcontratos desde un solo panel" },
      { icon: <Shield className="w-5 h-5" />, label: "Roles diferenciados", detail: "Contratista y mandante ven solo lo que les corresponde" },
    ],
  },
  {
    id: 2, type: "showcase", title: "Estados de pago digitales",
    description: "Crea, envía y aprueba estados de pago con flujos de aprobación configurables. Cada paso queda registrado con trazabilidad completa.",
    image: pagosImg, layout: "left",
    features: [
      { icon: <CheckCircle className="w-5 h-5" />, label: "Flujo de aprobación", detail: "Cadena configurable de aprobadores con orden y notificaciones" },
      { icon: <Mail className="w-5 h-5" />, label: "Notificaciones automáticas", detail: "Contratista y mandante reciben alertas en cada cambio de estado" },
      { icon: <Clock className="w-5 h-5" />, label: "Historial completo", detail: "Cada acción queda registrada: quién, cuándo y qué se hizo" },
    ],
  },
  {
    id: 3, type: "feature", title: "Presupuesto y avance",
    description: "Itemizado detallado con seguimiento de avance parcial y acumulado. Gráficos históricos para visualizar la evolución del proyecto mes a mes.",
    image: presupuestoImg, layout: "right",
    features: [
      { icon: <BarChart3 className="w-5 h-5" />, label: "Avance granular", detail: "Porcentaje parcial y acumulado por partida del presupuesto" },
      { icon: <TrendingUp className="w-5 h-5" />, label: "Historial gráfico", detail: "Evolución mensual del presupuesto con gráficos interactivos" },
      { icon: <FileText className="w-5 h-5" />, label: "Edición en línea", detail: "Actualiza cantidades y avances directamente en la plataforma" },
    ],
  },
  {
    id: 4, type: "showcase", title: "Gestión documental integrada",
    description: "Todos los documentos del proyecto organizados por tipo: contratos, planos, EETT, garantías. Integración directa con Google Drive.",
    image: documentosImg, image2: documentosImg, layout: "left",
    features: [
      { icon: <FolderOpen className="w-5 h-5" />, label: "Organización automática", detail: "Documentos clasificados por tipo con estructura predefinida" },
      { icon: <Camera className="w-5 h-5" />, label: "Registro fotográfico", detail: "Sube y organiza fotos de avance del proyecto" },
      { icon: <Shield className="w-5 h-5" />, label: "Google Drive sync", detail: "Respaldo automático de todos los archivos en la nube" },
    ],
  },
  {
    id: 5, type: "feature", title: "RFI y Adicionales",
    description: "Gestiona solicitudes de información (RFI) y adicionales con flujos conversacionales, urgencia, plazos y trazabilidad completa entre contratista y mandante.",
    image: rfiImg, image2: rfiImg, layout: "right",
    features: [
      { icon: <MessageSquare className="w-5 h-5" />, label: "Conversación estructurada", detail: "Hilo de mensajes entre contratista y mandante por cada RFI" },
      { icon: <AlertTriangle className="w-5 h-5" />, label: "Niveles de urgencia", detail: "Clasifica RFIs por urgencia y controla plazos de respuesta" },
      { icon: <FileText className="w-5 h-5" />, label: "Adicionales con aprobación", detail: "Presenta, revisa y aprueba adicionales con registro de acciones" },
    ],
  },
  {
    id: 6, type: "cta", title: "¿Listo para ordenar tus subcontratos?",
    description: "Agenda una demo y descubre cómo Gloster puede transformar la gestión de tus proyectos de construcción.",
    layout: "center", accent: "from-primary via-primary/95 to-primary/85",
  },
];

const SalesSubcontratos = () => {
  const navigate = useNavigate();
  return <SalesPresentation slides={slides} onPrevFromFirst={() => navigate("/sales?slide=last")} />;
};
export default SalesSubcontratos;
