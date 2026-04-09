import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, ArrowRight, 
  MessageSquare, FileText, Users, BarChart3, 
  Shield, Clock, Brain, Zap, Upload, Layers,
  TrendingUp, Search, GitMerge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContactModal from '@/components/ContactModal';

import dashboardImg from '@/assets/sales/licitaciones-dashboard.jpg';
import chatbotImg from '@/assets/sales/licitaciones-chatbot.jpg';
import ofertasImg from '@/assets/sales/licitaciones-ofertas.jpg';
import preguntasImg from '@/assets/sales/licitaciones-preguntas.jpg';
import itemizadoImg from '@/assets/sales/licitaciones-itemizado.jpg';

interface Feature {
  icon: React.ReactNode;
  label: string;
  detail: string;
}

interface Slide {
  id: number;
  type: 'hero' | 'feature' | 'showcase' | 'cta';
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  image2?: string;
  features?: Feature[];
  accent?: string;
  layout?: 'left' | 'right' | 'center';
}

const slides: Slide[] = [
  {
    id: 0,
    type: 'hero',
    title: 'Licitaciones',
    subtitle: 'Inteligentes',
    description: 'Crea, gestiona y adjudica procesos de licitación con IA. Desde la publicación hasta la comparación de ofertas, todo en un solo lugar.',
    layout: 'center',
    accent: 'from-primary via-primary/95 to-primary/85',
  },
  {
    id: 1,
    type: 'feature',
    title: 'Creación asistida por IA',
    description: 'Describe tu proyecto en lenguaje natural y el sistema genera automáticamente la licitación completa: itemizado jerárquico, calendario, documentos y lista de oferentes.',
    image: chatbotImg,
    layout: 'right',
    features: [
      { icon: <Brain className="w-5 h-5" />, label: 'IA Conversacional', detail: 'Chatbot que entiende tus especificaciones técnicas' },
      { icon: <FileText className="w-5 h-5" />, label: 'Itemizado automático', detail: 'Genera desglose jerárquico desde EETT' },
      { icon: <Zap className="w-5 h-5" />, label: 'En minutos', detail: 'Lo que antes tomaba horas, ahora son minutos' },
    ],
  },
  {
    id: 2,
    type: 'showcase',
    title: 'Gestión centralizada',
    description: 'Panel completo para administrar todas tus licitaciones activas. Estado, plazos, oferentes invitados y documentación en un solo dashboard.',
    image: dashboardImg,
    image2: dashboardImg,
    layout: 'left',
    features: [
      { icon: <Users className="w-5 h-5" />, label: 'Multi-oferente', detail: 'Invita y gestiona múltiples oferentes' },
      { icon: <Clock className="w-5 h-5" />, label: 'Calendario integrado', detail: 'Hitos, rondas de preguntas y plazos' },
      { icon: <Shield className="w-5 h-5" />, label: 'Acceso controlado', detail: 'Cada oferente ve solo lo que corresponde' },
    ],
  },
  {
    id: 3,
    type: 'feature',
    title: 'Itemizado jerárquico preciso',
    description: 'El sistema analiza tus especificaciones técnicas y genera un itemizado fiel a la estructura original. Códigos A, A.01, B, B.01 respetados tal cual.',
    image: itemizadoImg,
    layout: 'right',
    features: [
      { icon: <FileText className="w-5 h-5" />, label: 'Jerarquía fiel', detail: 'Respeta la codificación de tus EETT' },
      { icon: <BarChart3 className="w-5 h-5" />, label: 'Cantidades y unidades', detail: 'Partidas con unidad, cantidad y precio unitario' },
      { icon: <Upload className="w-5 h-5" />, label: 'Múltiples formas de crear', detail: 'Importa un archivo, usa asistencia IA o crea manualmente' },
    ],
  },
  {
    id: 4,
    type: 'showcase',
    title: 'Rondas de preguntas con IA',
    description: 'Los oferentes envían consultas. La IA sugiere respuestas basadas en tus documentos técnicos. Tú revisas, editas y publicas.',
    image: preguntasImg,
    layout: 'left',
    features: [
      { icon: <MessageSquare className="w-5 h-5" />, label: 'Q&A estructurado', detail: 'Rondas organizadas con trazabilidad' },
      { icon: <Brain className="w-5 h-5" />, label: 'Respuestas IA', detail: 'Sugerencias automáticas desde tus EETT' },
      { icon: <GitMerge className="w-5 h-5" />, label: 'Respuestas múltiples', detail: 'Agrupa preguntas similares y responde simultáneamente para ahorrar tiempo' },
    ],
  },
  {
    id: 5,
    type: 'feature',
    title: 'Comparación de ofertas',
    description: 'Visualiza y compara ofertas lado a lado. Precios unitarios, totales, plazos y documentación adjunta de cada oferente en una sola vista.',
    image: ofertasImg,
    layout: 'right',
    features: [
      { icon: <BarChart3 className="w-5 h-5" />, label: 'Side by side', detail: 'Compara precios por partida entre oferentes' },
      { icon: <FileText className="w-5 h-5" />, label: 'Documentación', detail: 'Ofertas con archivos adjuntos organizados' },
      { icon: <TrendingUp className="w-5 h-5" />, label: 'Análisis automático', detail: 'Detecta desviaciones de precio, cantidades y proyecta la mejor oferta combinada (cherry picking)' },
    ],
  },
  {
    id: 6,
    type: 'cta',
    title: '¿Listo para simplificar tus licitaciones?',
    description: 'Agenda una demo y descubre cómo Gloster puede transformar tu proceso de licitación.',
    layout: 'center',
    accent: 'from-primary via-primary/95 to-primary/85',
  },
];

const Sales = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const total = slides.length;

  const go = useCallback((idx: number) => {
    if (idx < 0 || idx >= total || idx === current) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current, total]);

  const next = useCallback(() => go(current + 1), [go, current]);
  const prev = useCallback(() => go(current - 1), [go, current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  const slide = slides[current];

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative select-none font-sans">
      {/* White header banner */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-border/30 px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster" 
            className="w-7 h-7"
          />
          <span className="text-sm font-semibold tracking-tight text-gray-900">Gloster</span>
        </div>

        {/* Progress bar */}
        <div className="flex-1 mx-8 flex gap-1.5 max-w-md">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="flex-1 h-1 rounded-full transition-all duration-500 cursor-pointer"
              style={{
                backgroundColor: i <= current 
                  ? 'hsl(var(--brand-yellow))' 
                  : 'hsl(0 0% 88%)',
              }}
            />
          ))}
        </div>

        {/* Slide counter */}
        <span className="text-xs text-gray-500 font-mono">
          {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      {/* Main content */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={slide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 pt-12"
        >
          {slide.type === 'hero' && <HeroSlide slide={slide} onCTA={() => next()} />}
          {slide.type === 'cta' && <CTASlide slide={slide} onCTA={() => setIsContactOpen(true)} />}
          {(slide.type === 'feature' || slide.type === 'showcase') && (
            <FeatureSlide slide={slide} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="absolute bottom-6 left-0 right-0 z-50 flex items-center justify-between px-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={prev}
          disabled={current === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-0 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current 
                  ? 'bg-brand-yellow w-6' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={next}
          disabled={current === total - 1}
          className="text-muted-foreground hover:text-foreground disabled:opacity-0 transition-opacity"
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
};

const HeroSlide: React.FC<{ slide: Slide; onCTA: () => void }> = ({ slide, onCTA }) => (
  <div className={`h-full w-full bg-gradient-to-br ${slide.accent} flex items-center justify-center px-8`}>
    <div className="max-w-3xl text-center">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <span className="inline-block px-3 py-1 text-xs font-medium tracking-widest uppercase bg-brand-yellow text-brand-yellow-foreground rounded-full mb-8">
          Módulo de Licitaciones
        </span>
      </motion.div>
      <motion.h1
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-5xl md:text-7xl font-bold text-primary-foreground leading-tight mb-4"
      >
        {slide.title}{' '}
        <span className="text-brand-yellow">{slide.subtitle}</span>
      </motion.h1>
      <motion.p
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed"
      >
        {slide.description}
      </motion.p>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Button
          size="lg"
          onClick={onCTA}
          className="bg-brand-yellow text-brand-yellow-foreground hover:bg-brand-yellow/90 px-8 py-3 text-base font-medium"
        >
          Ver cómo funciona
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  </div>
);

const CTASlide: React.FC<{ slide: Slide; onCTA: () => void }> = ({ slide, onCTA }) => (
  <div className={`h-full w-full bg-gradient-to-br ${slide.accent} flex items-center justify-center px-8`}>
    <div className="max-w-3xl text-center">
      <motion.h1
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight mb-6"
      >
        {slide.title}
      </motion.h1>
      <motion.p
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="text-lg text-primary-foreground/80 mb-8"
      >
        {slide.description}
      </motion.p>

      {/* Video embed placeholder */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        className="max-w-2xl mx-auto mb-8 rounded-xl overflow-hidden border border-primary-foreground/20 bg-black/20 aspect-video flex items-center justify-center"
      >
        {/* Replace the div below with an iframe or video element */}
        {/* Example: <iframe src="https://www.loom.com/embed/VIDEO_ID" allowFullScreen className="w-full h-full" /> */}
        <div className="text-primary-foreground/40 text-sm flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full border-2 border-primary-foreground/30 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[12px] border-l-primary-foreground/40 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
          </div>
          <span>Video demo</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Button
          size="lg"
          onClick={onCTA}
          className="bg-brand-yellow text-brand-yellow-foreground hover:bg-brand-yellow/90 px-8 py-3 text-base font-medium"
        >
          Agendar Demo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  </div>
);

const FeatureSlide: React.FC<{ slide: Slide }> = ({ slide }) => {
  const isLeft = slide.layout === 'left';
  const hasTwoImages = !!slide.image2;
  
  return (
    <div className="h-full w-full flex items-center bg-background">
      <div className={`w-full h-full flex flex-col md:flex-row ${isLeft ? '' : 'md:flex-row-reverse'}`}>
        {/* Image side */}
        <div className="flex-1 relative flex items-center justify-center p-6 md:p-10 bg-muted/30">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className={`relative w-full max-w-2xl ${hasTwoImages ? 'flex flex-col gap-4' : ''}`}
          >
            <div className={`rounded-xl overflow-hidden shadow-2xl border border-border/50 ${hasTwoImages ? '' : ''}`}>
              <img 
                src={slide.image} 
                alt={slide.title}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
            {hasTwoImages && (
              <div className="rounded-xl overflow-hidden shadow-2xl border border-border/50">
                <img 
                  src={slide.image2} 
                  alt={`${slide.title} - vista adicional`}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            )}
            <div className="absolute -inset-4 bg-brand-yellow/5 rounded-2xl -z-10 blur-2xl" />
          </motion.div>
        </div>

        {/* Content side */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-12 lg:p-16">
          <div className="max-w-md">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="w-10 h-1 bg-brand-yellow rounded-full mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
                {slide.title}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                {slide.description}
              </p>
            </motion.div>

            {slide.features && (
              <div className="space-y-4">
                {slide.features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: isLeft ? 20 : -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-yellow/10 flex items-center justify-center text-brand-yellow-foreground">
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
