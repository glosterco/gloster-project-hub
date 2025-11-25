import linkedinBannerBg from "@/assets/linkedin-banner-bg.jpg";
import { Building2, FileCheck, Users } from "lucide-react";

const RRSS = () => {
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
            <div className="rounded-lg overflow-hidden border border-border relative">
              {/* Background Image */}
              <img
                src={linkedinBannerBg}
                alt="Banner de LinkedIn"
                className="w-full h-auto"
              />
              
              {/* Overlay Content */}
              <div className="absolute inset-0 flex flex-col justify-between px-16 py-12">
                {/* Top - Text */}
                <div className="space-y-2">
                  <p className="text-3xl text-white/95 drop-shadow-md max-w-xl font-medium">
                    Simplifica la gestión de tus proyectos de construcción
                  </p>
                </div>

                {/* Bottom Right - Icons */}
                <div className="flex justify-end">
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
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Dimensiones: 1568 x 512 px
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RRSS;
