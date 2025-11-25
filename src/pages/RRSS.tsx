import linkedinBannerCrane from "@/assets/linkedin-banner-crane.jpg";
import linkedinBannerBuildings from "@/assets/linkedin-banner-buildings.jpg";
import { Building2, FileCheck, Users, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const RRSS = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);
  const banners = [
    { src: linkedinBannerCrane, name: "Grúa Torre" },
    { src: linkedinBannerBuildings, name: "Edificios en Construcción" }
  ];

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const downloadBannerWithOverlay = async () => {
    if (!bannerRef.current) return;
    
    try {
      const canvas = await html2canvas(bannerRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement("a");
      link.download = `linkedin-banner-${banners[currentBanner].name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Banner descargado exitosamente");
    } catch (error) {
      console.error("Error downloading banner:", error);
      toast.error("Error al descargar el banner");
    }
  };

  const downloadBackgroundOnly = () => {
    const link = document.createElement("a");
    link.download = `linkedin-banner-bg-${banners[currentBanner].name.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    link.href = banners[currentBanner].src;
    link.click();
    
    toast.success("Imagen de fondo descargada");
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
              <div ref={bannerRef} className="rounded-lg overflow-hidden border border-border relative">
                {/* Background Image */}
                <img
                  src={banners[currentBanner].src}
                  alt={banners[currentBanner].name}
                  className="w-full h-auto"
                />
                
                {/* Overlay Content */}
                <div className="absolute inset-0 flex flex-col items-end justify-end px-16 pb-8">
                  {/* Text aligned right above icons */}
                  <p className="text-xl text-white drop-shadow-lg font-medium mb-3 whitespace-nowrap">
                    Simplifica la gestión de tus proyectos de construcción
                  </p>

                  {/* Icons at bottom right */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gloster-gray" />
                      </div>
                      <span className="text-xs text-white drop-shadow-md">Proyectos</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-gloster-gray" />
                      </div>
                      <span className="text-xs text-white drop-shadow-md">Documentación</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gloster-gray" />
                      </div>
                      <span className="text-xs text-white drop-shadow-md">Colaboración</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Carousel Controls */}
              <button
                onClick={prevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">
                  Dimensiones: 1568 x 512 px
                </p>
                <p className="text-sm text-muted-foreground">
                  {banners[currentBanner].name} ({currentBanner + 1}/{banners.length})
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={downloadBackgroundOnly}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar fondo
                </Button>
                <Button
                  onClick={downloadBannerWithOverlay}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar banner completo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RRSS;
