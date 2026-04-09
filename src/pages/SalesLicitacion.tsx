import React from "react";
import { Brain, FileText, Zap, Users, Clock, Shield, BarChart3, Upload, MessageSquare, GitMerge, TrendingUp } from "lucide-react";
import SalesPresentation, { Slide } from "@/components/sales/SalesPresentation";

import dashboardImg from "@/assets/sales/licitaciones-dashboard.jpg";
import chatbotImg from "@/assets/sales/licitaciones-chatbot.jpg";
import ofertasImg from "@/assets/sales/licitaciones-ofertas.jpg";
import preguntasImg from "@/assets/sales/licitaciones-preguntas.jpg";
import itemizadoImg from "@/assets/sales/licitaciones-itemizado.jpg";

const slides: Slide[] = [
  {
    id: 0, type: "hero", title: "Licitaciones", subtitle: "Inteligentes", badge: "Módulo de Licitaciones",
    description: "Crea, gestiona y adjudica procesos de licitación con IA. Desde la publicación hasta la comparación de ofertas, todo en un solo lugar.",
    layout: "center", accent: "from-primary via-primary/95 to-primary/85",
  },
  {
    id: 1, type: "feature", title: "Creación asistida por IA",
    description: "Describe tu proyecto en lenguaje natural y el sistema genera automáticamente la licitación completa: itemizado jerárquico, calendario, documentos y lista de oferentes.",
    image: chatbotImg, layout: "right",
    features: [
      { icon: <Brain className="w-5 h-5" />, label: "IA Conversacional", detail: "Chatbot que entiende tus especificaciones técnicas" },
      { icon: <FileText className="w-5 h-5" />, label: "Itemizado automático", detail: "Genera desglose jerárquico desde EETT" },
      { icon: <Zap className="w-5 h-5" />, label: "En minutos", detail: "Lo que antes tomaba horas, ahora son minutos" },
    ],
  },
  {
    id: 2, type: "showcase", title: "Gestión centralizada",
    description: "Panel completo para administrar todas tus licitaciones activas. Estado, plazos, oferentes invitados y documentación en un solo dashboard.",
    image: dashboardImg, image2: dashboardImg, layout: "left",
    features: [
      { icon: <Users className="w-5 h-5" />, label: "Multi-oferente", detail: "Invita, gestiona y notifica múltiples oferentes de manera automática" },
      { icon: <Clock className="w-5 h-5" />, label: "Calendario integrado", detail: "Hitos, rondas de preguntas y plazos" },
      { icon: <Shield className="w-5 h-5" />, label: "Acceso controlado", detail: "Cada oferente ve solo lo que corresponde" },
    ],
  },
  {
    id: 3, type: "feature", title: "Itemizado jerárquico preciso",
    description: "El sistema analiza tus especificaciones técnicas y genera un itemizado fiel a la estructura original. Los valores son editables de manera online y centralizada para evitar confusiones",
    image: itemizadoImg, layout: "right",
    features: [
      { icon: <FileText className="w-5 h-5" />, label: "Jerarquía fiel", detail: "Respeta la codificación de tus EETT" },
      { icon: <BarChart3 className="w-5 h-5" />, label: "Cantidades y unidades", detail: "Partidas con unidad, cantidad y precio unitario" },
      { icon: <Upload className="w-5 h-5" />, label: "Múltiples formas de crear", detail: "Importa un archivo, usa asistencia IA o crea manualmente" },
    ],
  },
  {
    id: 4, type: "showcase", title: "Rondas de preguntas con IA",
    description: "Los oferentes envían consultas. La IA sugiere respuestas basadas en tus documentos técnicos. Tú revisas, editas y publicas.",
    image: preguntasImg, layout: "left",
    features: [
      { icon: <MessageSquare className="w-5 h-5" />, label: "Q&A estructurado", detail: "Rondas organizadas con trazabilidad" },
      { icon: <Brain className="w-5 h-5" />, label: "Respuestas IA", detail: "Sugerencias automáticas desde tus EETT" },
      { icon: <GitMerge className="w-5 h-5" />, label: "Respuestas múltiples", detail: "Agrupa preguntas similares y responde simultáneamente" },
    ],
  },
  {
    id: 5, type: "feature", title: "Comparación de ofertas",
    description: "Visualiza y compara ofertas lado a lado. Precios unitarios, totales, plazos y documentación adjunta de cada oferente en una sola vista.",
    image: ofertasImg, layout: "right",
    features: [
      { icon: <BarChart3 className="w-5 h-5" />, label: "Side by side", detail: "Compara precios por partida entre oferentes" },
      { icon: <FileText className="w-5 h-5" />, label: "Documentación", detail: "Ofertas con archivos adjuntos organizados" },
      { icon: <TrendingUp className="w-5 h-5" />, label: "Análisis automático", detail: "Detecta desviaciones de precio, cantidades y proyecta la mejor oferta combinada (cherry picking)" },
    ],
  },
  {
    id: 6, type: "cta", title: "¿Listo para simplificar tus licitaciones?",
    description: "Agenda una demo y descubre cómo Gloster puede transformar tu proceso de licitación.",
    layout: "center", accent: "from-primary via-primary/95 to-primary/85",
  },
];

const SalesLicitacion = () => <SalesPresentation slides={slides} />;
export default SalesLicitacion;
