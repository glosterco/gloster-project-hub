import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Gavel, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Sales = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const total = 3;

  const go = useCallback((idx: number) => {
    if (idx < 0 || idx >= total || idx === current) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current, total]);

  const next = useCallback(() => go(current + 1), [go, current]);
  const prev = useCallback(() => go(current - 1), [go, current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative select-none font-sans">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-border/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" alt="Gloster" className="w-7 h-7" />
          <span className="text-sm font-semibold tracking-tight text-foreground">Gloster</span>
        </div>
        <div className="flex-1 mx-8 flex gap-1.5 max-w-md">
          {[0, 1, 2].map((i) => (
            <button key={i} onClick={() => go(i)} className="flex-1 h-1 rounded-full transition-all duration-500 cursor-pointer" style={{ backgroundColor: i <= current ? "hsl(var(--brand-yellow))" : "hsl(0 0% 88%)" }} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 pt-12"
        >
          {current === 0 && <BrandSlide onCTA={() => next()} />}
          {current === 1 && <AboutSlide onCTA={() => next()} />}
          {current === 2 && <ToolsSlide onNavigate={navigate} />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="absolute bottom-6 left-0 right-0 z-50 flex items-center justify-between px-8">
        <Button variant="ghost" size="sm" onClick={prev} disabled={current === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-0 transition-opacity">
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <button key={i} onClick={() => go(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "bg-brand-yellow w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`} />
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={next} disabled={current === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-0 transition-opacity">
          Siguiente <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

const BrandSlide: React.FC<{ onCTA: () => void }> = ({ onCTA }) => (
  <div className="h-full w-full bg-gradient-to-br from-primary via-primary/95 to-primary/85 flex items-center justify-center px-8">
    <div className="text-center flex flex-col items-center">
      <motion.img
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png"
        alt="Gloster"
        className="w-28 h-28 md:w-36 md:h-36 mb-8"
      />
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-6xl md:text-8xl font-bold text-primary-foreground tracking-tight mb-4"
      >
        Gloster
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="text-xl md:text-2xl text-primary-foreground/70 font-light max-w-xl leading-relaxed"
      >
        Tecnología para la construcción
      </motion.p>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.85, duration: 0.5 }} className="mt-10">
        <Button size="lg" onClick={onCTA} className="bg-brand-yellow text-brand-yellow-foreground hover:bg-brand-yellow/90 px-8 py-3 text-base font-medium">
          Conocer más <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  </div>
);

const AboutSlide: React.FC<{ onCTA: () => void }> = ({ onCTA }) => (
  <div className="h-full w-full bg-background flex items-center justify-center px-8">
    <div className="max-w-2xl text-center">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
        <div className="w-10 h-1 bg-brand-yellow rounded-full mb-6 mx-auto" />
      </motion.div>
      <motion.h2
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6"
      >
        ¿Quiénes somos?
      </motion.h2>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        className="text-lg text-muted-foreground leading-relaxed mb-6"
      >
        Somos un equipo que conoce de primera mano los problemas de gestión en la industria de la construcción. Planillas interminables, correos perdidos, estados de pago que nadie sabe dónde están, procesos de licitación que toman semanas de trabajo manual.
      </motion.p>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        className="text-lg text-muted-foreground leading-relaxed mb-10"
      >
        Creamos Gloster para resolver eso: una plataforma que centraliza, ordena y automatiza la gestión de proyectos de construcción. Sin complejidad innecesaria, con herramientas que realmente se usan.
      </motion.p>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
        <Button size="lg" onClick={onCTA} className="bg-brand-yellow text-brand-yellow-foreground hover:bg-brand-yellow/90 px-8 py-3 text-base font-medium">
          Ver herramientas <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  </div>
);

const ToolsSlide: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
  <div className="h-full w-full bg-background flex items-center justify-center px-8">
    <div className="max-w-3xl w-full text-center">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
        <div className="w-10 h-1 bg-brand-yellow rounded-full mb-6 mx-auto" />
      </motion.div>
      <motion.h2
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3"
      >
        Dos herramientas, un objetivo
      </motion.h2>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-base text-muted-foreground mb-12"
      >
        Hemos desarrollado dos módulos especializados para cubrir las necesidades principales de gestión en construcción.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <motion.button
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          onClick={() => onNavigate("/sales/licitacion")}
          className="group p-8 rounded-2xl border border-border bg-card hover:border-brand-yellow/50 hover:shadow-lg transition-all duration-300 text-left cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-yellow/10 flex items-center justify-center mb-5 group-hover:bg-brand-yellow/20 transition-colors">
            <Gavel className="w-8 h-8 text-brand-yellow-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Licitaciones</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Crea, gestiona y adjudica procesos de licitación con asistencia de IA. Itemizados, rondas de preguntas y comparación de ofertas.
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-brand-yellow-foreground group-hover:gap-2 transition-all">
            Ver presentación <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </motion.button>

        <motion.button
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          onClick={() => onNavigate("/sales/subcontratos")}
          className="group p-8 rounded-2xl border border-border bg-card hover:border-brand-yellow/50 hover:shadow-lg transition-all duration-300 text-left cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-yellow/10 flex items-center justify-center mb-5 group-hover:bg-brand-yellow/20 transition-colors">
            <HardHat className="w-8 h-8 text-brand-yellow-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Subcontratos</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Controla estados de pago, documentos, presupuesto, RFI y adicionales de todos tus subcontratos en un solo lugar.
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-brand-yellow-foreground group-hover:gap-2 transition-all">
            Ver presentación <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </motion.button>
      </div>
    </div>
  </div>
);

export default Sales;
