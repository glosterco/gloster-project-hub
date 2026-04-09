import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactModal from "@/components/ContactModal";
import { useNavigate } from "react-router-dom";

export interface Feature {
  icon: React.ReactNode;
  label: string;
  detail: string;
}

export interface Slide {
  id: number;
  type: "hero" | "feature" | "showcase" | "cta";
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  image2?: string;
  features?: Feature[];
  accent?: string;
  layout?: "left" | "right" | "center";
  badge?: string;
}

const ZoomableImage: React.FC<{ src: string; alt: string; onClick: (src: string) => void }> = ({ src, alt, onClick }) => (
  <div
    className="rounded-xl overflow-hidden shadow-2xl border border-border/50 cursor-pointer transition-transform duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)]"
    onClick={() => onClick(src)}
  >
    <img src={src} alt={alt} className="w-full h-auto" loading="lazy" />
  </div>
);

const HeroSlide: React.FC<{ slide: Slide; onCTA: () => void }> = ({ slide, onCTA }) => (
  <div className={`h-full w-full bg-gradient-to-br ${slide.accent} flex items-center justify-center px-4 md:px-8 pb-8 md:pb-0`}>
    <div className="max-w-3xl text-center">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
        <span className="inline-block px-3 py-1 text-xs font-medium tracking-widest uppercase bg-brand-yellow text-brand-yellow-foreground rounded-full mb-4 md:mb-8">
          {slide.badge || slide.title}
        </span>
      </motion.div>
      <motion.h1
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-3xl md:text-5xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-3 md:mb-4"
      >
        {slide.title} <span className="text-brand-yellow">{slide.subtitle}</span>
      </motion.h1>
      <motion.p
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        className="text-sm md:text-lg lg:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-6 md:mb-10 leading-relaxed"
      >
        {slide.description}
      </motion.p>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
        <Button size="lg" onClick={onCTA} className="bg-brand-yellow text-brand-yellow-foreground hover:bg-brand-yellow/90 px-8 py-3 text-base font-medium">
          Ver cómo funciona
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  </div>
);

const CTASlide: React.FC<{ slide: Slide; onCTA: () => void }> = ({ slide, onCTA }) => (
  <div className={`h-full w-full bg-gradient-to-br ${slide.accent} flex items-center justify-center px-6`}>
    <div className="max-w-3xl w-full text-center flex flex-col items-center">
      <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="text-3xl md:text-4xl font-bold text-primary-foreground leading-tight mb-3">
        {slide.title}
      </motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="text-base text-primary-foreground/80 mb-5">
        {slide.description}
      </motion.p>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="mb-5">
        <Button size="lg" onClick={onCTA} className="bg-brand-yellow text-brand-yellow-foreground hover:bg-brand-yellow/90 px-8 py-3 text-base font-medium">
          Agendar Demo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="w-full max-w-xl rounded-xl overflow-hidden border border-primary-foreground/20 bg-black/20 aspect-video flex items-center justify-center">
        <div className="text-primary-foreground/40 text-sm flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full border-2 border-primary-foreground/30 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[10px] border-l-primary-foreground/40 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
          </div>
          <span>Video demo</span>
        </div>
      </motion.div>
    </div>
  </div>
);

const FeatureSlide: React.FC<{ slide: Slide; onImageClick: (src: string) => void }> = ({ slide, onImageClick }) => {
  const isLeft = slide.layout === "left";
  const hasTwoImages = !!slide.image2;
  return (
    <div className="h-full w-full flex items-center bg-background overflow-y-auto">
      <div className={`w-full h-full flex flex-col md:flex-row ${isLeft ? "" : "md:flex-row-reverse"}`}>
        <div className="flex-shrink-0 md:flex-1 relative flex items-center justify-center p-4 md:p-10 bg-muted/30">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className={`relative w-full max-w-2xl ${hasTwoImages ? "flex flex-col gap-2 md:gap-4" : ""}`}>
            <ZoomableImage src={slide.image!} alt={slide.title} onClick={onImageClick} />
            {hasTwoImages && <ZoomableImage src={slide.image2!} alt={`${slide.title} - vista adicional`} onClick={onImageClick} />}
            <div className="absolute -inset-4 bg-brand-yellow/5 rounded-2xl -z-10 blur-2xl" />
          </motion.div>
        </div>
        <div className="flex-shrink-0 md:flex-1 flex items-center justify-center p-4 pb-10 md:p-12 lg:p-16">
          <div className="max-w-md">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <div className="w-10 h-1 bg-brand-yellow rounded-full mb-3 md:mb-6" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-2 md:mb-4">{slide.title}</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-8">{slide.description}</p>
            </motion.div>
            {slide.features && (
              <div className="space-y-4">
                {slide.features.map((f, i) => (
                  <motion.div key={i} initial={{ x: isLeft ? 20 : -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-yellow/10 flex items-center justify-center text-brand-yellow-foreground">{f.icon}</div>
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

interface SalesPresentationProps {
  slides: Slide[];
  onPrevFromFirst?: () => void;
}

const SalesPresentation: React.FC<SalesPresentationProps> = ({ slides, onPrevFromFirst }) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const total = slides.length;

  const go = useCallback((idx: number) => {
    if (idx < 0 || idx >= total || idx === current) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current, total]);

  const next = useCallback(() => go(current + 1), [go, current]);
  const prev = useCallback(() => {
    if (current === 0 && onPrevFromFirst) {
      onPrevFromFirst();
    } else {
      go(current - 1);
    }
  }, [go, current, onPrevFromFirst]);

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

  const slide = slides[current];

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative select-none font-sans">
      {/* Edge click zones */}
      <div className="absolute left-0 top-12 bottom-8 md:bottom-16 w-8 md:w-16 z-40 cursor-pointer" onClick={prev} />
      <div className="absolute right-0 top-12 bottom-8 md:bottom-16 w-8 md:w-16 z-40 cursor-pointer" onClick={next} />

      <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-border/30 px-6 py-3 flex items-center justify-between">
        <a href="/sales" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <img src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" alt="Gloster" className="w-7 h-7" />
          <span className="text-sm font-semibold tracking-tight text-foreground">Gloster</span>
        </a>
        <div className="flex-1 mx-8 flex gap-1.5 max-w-md">
          {slides.map((_, i) => (
            <button key={i} onClick={() => go(i)} className="flex-1 h-1 rounded-full transition-all duration-500 cursor-pointer" style={{ backgroundColor: i <= current ? "hsl(var(--brand-yellow))" : "hsl(0 0% 88%)" }} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <AnimatePresence custom={direction} mode="wait">
        <motion.div key={slide.id} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }} className="absolute inset-0 pt-12">
          {slide.type === "hero" && <HeroSlide slide={slide} onCTA={() => next()} />}
          {slide.type === "cta" && <CTASlide slide={slide} onCTA={() => setIsContactOpen(true)} />}
          {(slide.type === "feature" || slide.type === "showcase") && <FeatureSlide slide={slide} onImageClick={setLightboxSrc} />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {lightboxSrc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8 cursor-pointer" onClick={() => setLightboxSrc(null)}>
            <motion.img initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.3 }} src={lightboxSrc} alt="Vista ampliada" className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 md:bottom-6 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8">
        <Button variant="ghost" size="sm" onClick={prev} disabled={current === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-0 transition-opacity hidden md:flex">
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        <div className="flex gap-1.5 md:gap-2 mx-auto md:mx-0">
          {slides.map((_, i) => (
            <button key={i} onClick={() => go(i)} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-300 ${i === current ? "bg-brand-yellow w-4 md:w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`} />
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={next} disabled={current === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-0 transition-opacity hidden md:flex">
          Siguiente <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
};

export default SalesPresentation;
