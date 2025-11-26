import { Building2, FileCheck, Users, Download } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const RRSS = () => {
  const banners = [
    { src: "/linkedin-banner-crane.jpg", name: "Grúa Torre" },
    { src: "/linkedin-banner-buildings.jpg", name: "Edificios en Construcción" }
  ];

  const downloadBanner = async (bannerSrc: string, bannerName: string) => {
    try {
      // Create canvas at full resolution (match actual image dimensions)
      const canvas = document.createElement('canvas');
      canvas.width = 3138;
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
        img.src = bannerSrc;
      });

      ctx.drawImage(img, 0, 0, 3138, 512);

      // Draw text overlay (scaled for 512px height)
      ctx.font = 'bold 40px Rubik, sans-serif';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 12;
      ctx.textAlign = 'right';
      ctx.fillText('Simplifica la gestión de tus proyectos de construcción', 3090, 360);

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
        ctx.fillText(label, x, y + 60);
      };

      drawIcon(2680, 440, 'Proyectos');
      drawIcon(2870, 440, 'Documentación');
      drawIcon(3050, 440, 'Colaboración');

      // Download with maximum quality
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Error al crear la imagen");
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `linkedin-banner-${bannerName.toLowerCase().replace(/\s+/g, "-")}.jpg`;
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
          {banners.map((banner, index) => (
            <div key={index} className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {banner.name}
              </h2>
              <div className="w-full overflow-auto">
                <div 
                  className="relative inline-block cursor-zoom-in hover:scale-105 transition-transform duration-300" 
                  style={{ width: '3138px', height: '512px' }}
                >
                  {/* Background Image */}
                  <img
                    src={banner.src}
                    alt={banner.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  
                  {/* Overlay Content */}
                  <div className="absolute inset-0 flex flex-col items-end justify-end px-12 pb-8 pointer-events-none">
                    <p className="text-[40px] text-white drop-shadow-lg font-semibold mb-12 whitespace-nowrap">
                      Simplifica la gestión de tus proyectos de construcción
                    </p>

                    <div className="flex gap-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-gloster-yellow/95 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-gloster-gray" />
                        </div>
                        <span className="text-2xl text-white drop-shadow-md font-semibold">Proyectos</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-gloster-yellow/95 flex items-center justify-center">
                          <FileCheck className="w-7 h-7 text-gloster-gray" />
                        </div>
                        <span className="text-2xl text-white drop-shadow-md font-semibold">Documentación</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-gloster-yellow/95 flex items-center justify-center">
                          <Users className="w-7 h-7 text-gloster-gray" />
                        </div>
                        <span className="text-2xl text-white drop-shadow-md font-semibold">Colaboración</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Dimensiones de descarga: 3138 x 512 px (alta calidad)
                </p>
                <Button
                  onClick={() => downloadBanner(banner.src, banner.name)}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar banner
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RRSS;
