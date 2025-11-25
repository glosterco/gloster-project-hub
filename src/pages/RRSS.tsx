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
              <div className="absolute inset-0 flex items-center justify-between px-16">
                {/* Left Side - Text */}
                <div className="space-y-3">
                  <h3 className="text-4xl font-bold text-white drop-shadow-lg">
                    Gloster
                  </h3>
                  <p className="text-xl text-white/90 drop-shadow-md max-w-md">
                    Simplifica la gestión de tus proyectos de construcción
                  </p>
                </div>

                {/* Right Side - Icons */}
                <div className="flex gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-gloster-gray" />
                    </div>
                    <span className="text-sm text-white drop-shadow-md">Proyectos</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                      <FileCheck className="w-8 h-8 text-gloster-gray" />
                    </div>
                    <span className="text-sm text-white drop-shadow-md">Estados de Pago</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gloster-yellow/90 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gloster-gray" />
                    </div>
                    <span className="text-sm text-white drop-shadow-md">Colaboración</span>
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
