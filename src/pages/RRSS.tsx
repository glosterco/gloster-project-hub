import { Building2, FileCheck, Users, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const RRSS = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);
  const banners = [
    { src: "/linkedin-banner-crane.jpg", name: "Grúa Torre" },
    { src: "/linkedin-banner-buildings.jpg", name: "Edificios en Construcción" }
  ];

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const downloadBanner = async () => {
    try {
      // Create canvas at full resolution (match actual image dimensions)
      const canvas = document.createElement('canvas');
      canvas.width = 1568;
      canvas.height = 512;
      const ctx = canvas.getContext('2d', { alpha: false });
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Enable high quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Load and draw background image at full resolution
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = banners[currentBanner].src;
      });

      ctx.drawImage(img, 0, 0, 1568, 512);

      // Draw text overlay (scaled for 512px height)
      ctx.font = 'bold 40px Rubik, sans-serif';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 12;
      ctx.textAlign = 'right';
      ctx.fillText('Simplifica la gestión de tus proyectos de construcción', 1520, 425);

      // Draw icon circles (scaled for 512px height)
      const drawIcon = (x: number, y: number, label: string) => {
        ctx.shadowBlur = 0;
        
        // Yellow circle
        ctx.fillStyle = 'rgba(254, 204, 0, 0.95)';
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Rubik, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 6;
        ctx.fillText(label, x, y + 52);
      };

      drawIcon(1360, 435, 'Proyectos');
      drawIcon(1450, 435, 'Documentación');
      drawIcon(1540, 435, 'Colaboración');

      // Download with maximum quality
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Error al crear la imagen");
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `linkedin-banner-${banners[currentBanner].name.toLowerCase().replace(/\s+/g, "-")}.jpg`;
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("Banner descargado exitosamente");
      }, 'image/jpeg', 1.0);
    } catch (error) {
      console.error("Error downloading banner:", error);
      toast.error("Error al descargar el banner");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Recursos de Redes Sociales
          </h1>
          <p className="text-muted-foreground">
            Imágenes y banners generados para marketing y redes sociales
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Banner de LinkedIn
            </h2>
            <div className="relative">
              <div 
                ref={bannerRef}
                className="rounded-lg overflow-hidden border border-border relative" 
                style={{ height: '256px', width: '1568px', maxWidth: '100%' }}
              >
                {/* Background Image */}
                <img
                  src={banners[currentBanner].src}
                  alt={banners[currentBanner].name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                
                {/* Overlay Content */}
                <div className="absolute inset-0 flex flex-col items-end justify-end px-8 pb-4">
                  <p className="text-base text-white drop-shadow-lg font-semibold mb-2 whitespace-nowrap">
                    Simplifica la gestión de tus proyectos de construcción
                  </p>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5 text-gloster-gray" />
                      </div>
                      <span className="text-[11px] text-white drop-shadow-md font-semibold">Proyectos</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                        <FileCheck className="w-3.5 h-3.5 text-gloster-gray" />
                      </div>
                      <span className="text-[11px] text-white drop-shadow-md font-semibold">Documentación</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-gloster-gray" />
                      </div>
                      <span className="text-[11px] text-white drop-shadow-md font-semibold">Colaboración</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={prevBanner}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">
                  Dimensiones de descarga: 1568 x 512 px (alta calidad)
                </p>
                <p className="text-sm text-muted-foreground">
                  {banners[currentBanner].name} ({currentBanner + 1}/{banners.length})
                </p>
              </div>
              <Button
                onClick={downloadBanner}
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar banner
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RRSS;
