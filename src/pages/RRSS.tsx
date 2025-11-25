import { Building2, FileCheck, Users, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import domtoimage from "dom-to-image-more";

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
    if (!bannerRef.current) return;
    
    try {
      const dataUrl = await domtoimage.toJpeg(bannerRef.current, {
        width: 1568,
        height: 256,
        quality: 0.95,
        bgcolor: '#000000'
      });

      const link = document.createElement('a');
      link.download = `linkedin-banner-${banners[currentBanner].name.toLowerCase().replace(/\s+/g, "-")}.jpg`;
      link.href = dataUrl;
      link.click();
      toast.success("Banner descargado exitosamente");
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
                <div className="absolute inset-0 flex flex-col items-end justify-end px-8 pb-3">
                  <p className="text-sm text-white drop-shadow-lg font-medium mb-1.5 whitespace-nowrap">
                    Simplifica la gestión de tus proyectos de construcción
                  </p>

                  <div className="flex gap-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-5 h-5 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                        <Building2 className="w-2.5 h-2.5 text-gloster-gray" />
                      </div>
                      <span className="text-[9px] text-white drop-shadow-md">Proyectos</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-5 h-5 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                        <FileCheck className="w-2.5 h-2.5 text-gloster-gray" />
                      </div>
                      <span className="text-[9px] text-white drop-shadow-md">Documentación</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-5 h-5 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                        <Users className="w-2.5 h-2.5 text-gloster-gray" />
                      </div>
                      <span className="text-[9px] text-white drop-shadow-md">Colaboración</span>
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
                  Dimensiones originales: 1568 x 512 px
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
