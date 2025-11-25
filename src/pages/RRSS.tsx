import linkedinBanner from "@/assets/linkedin-banner.jpg";

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
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={linkedinBanner}
                alt="Banner de LinkedIn"
                className="w-full h-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Dimensiones: 1568 x 384 px
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RRSS;
