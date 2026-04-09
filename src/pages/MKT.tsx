import {
  Building,
  FileText,
  Clock,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Upload,
  Monitor,
  Smartphone,
  FolderTree,
  MessageSquare,
  PlusCircle,
  Calculator,
  FolderOpen,
  Camera,
  CreditCard,
  Brain,
  Zap,
  GitMerge,
  TrendingUp,
  HardHat,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useState } from "react";
import ContactModal from "@/components/ContactModal";

// URLs de las imágenes subidas
const homeImage = "/lovable-uploads/4e1775b7-5550-4e5a-a78b-261535b4c52b.png";
const dashboardContratistaImage = "/lovable-uploads/25a89fa1-64d5-488b-b6b2-c85b6daee5f5.png";
const payment1Image = "/lovable-uploads/fc73cc7b-9b91-43d6-a910-2c7ada490b57.png";
const dashboardMandanteImage = "/lovable-uploads/13012c60-5258-4c3f-b6ba-fa85b2530748.png";
const submissionImage = "/lovable-uploads/736cf34a-679d-4c6a-bfaf-b1c2225022d9.png";

type ProductMode = "subcontratos" | "licitaciones";

// ─── Content definitions per mode ────────────────────────────────────

const heroContent = {
  subcontratos: {
    title: (
      <>
        Gestión documental <br />
        <span className="text-brand-yellow">Inteligente</span> para la Construcción
      </>
    ),
    subtitle:
      "La plataforma que revoluciona la gestión de estados de pagos entre mandantes y contratistas. Automatiza procesos, reduce tiempos y elimina errores.",
    stats: [
      { value: "Reduce", label: "Tiempos de gestión y revisión" },
      { value: "Mejora", label: "Trazabilidad y orden documental" },
      { value: "Evita", label: "Errores de comunicación" },
    ],
  },
  licitaciones: {
    title: (
      <>
        Licitaciones <br />
        <span className="text-brand-yellow">Inteligentes</span> con IA
      </>
    ),
    subtitle:
      "Crea, gestiona y adjudica procesos de licitación con asistencia de IA. Desde la publicación hasta la comparación de ofertas, todo en un solo lugar.",
    stats: [
      { value: "IA", label: "Creación asistida de licitaciones" },
      { value: "Compara", label: "Ofertas lado a lado automáticamente" },
      { value: "Centraliza", label: "Documentos, preguntas y oferentes" },
    ],
  },
};

const problemContent = {
  subcontratos: {
    title: "¿Te suena familiar?",
    subtitle: "Los problemas más comunes en la gestión documental de estados de pagos en la construcción",
    cards: [
      { icon: Clock, title: "Retrasos Constantes", text: "Semanas esperando aprobaciones, documentos perdidos en emails, y procesos manuales que retrasan el flujo de trabajo." },
      { icon: FileText, title: "Documentación Desorganizada", text: "Facturas en diferentes formatos, estados de pago confusos, y desorden en los documentos críticos." },
      { icon: Users, title: "Comunicación Fragmentada", text: "WhatsApp, emails, llamadas... Información dispersa que genera malentendidos y errores costosos." },
      { icon: FolderTree, title: "Falta de trazabilidad", text: "Muchas versiones y desorganización de la documentación. Envíos reiterados de información pierden el orden y los registros." },
    ],
  },
  licitaciones: {
    title: "¿Te suena familiar?",
    subtitle: "Los problemas más comunes en los procesos de licitación en la construcción",
    cards: [
      { icon: Clock, title: "Procesos Interminables", text: "Semanas armando planillas, recopilando ofertas por email y comparando manualmente cada partida." },
      { icon: FileText, title: "Itemizados Inconsistentes", text: "Cada oferente entrega su presupuesto en un formato distinto. Imposible comparar manzanas con manzanas." },
      { icon: Users, title: "Preguntas sin Control", text: "Consultas de oferentes dispersas en emails y WhatsApp. Sin registro, sin trazabilidad, sin orden." },
      { icon: FolderTree, title: "Comparación Manual", text: "Horas copiando datos en planillas para comparar ofertas. Alto riesgo de errores y decisiones desinformadas." },
    ],
  },
};

const toolsContent = {
  subcontratos: [
    {
      icon: CreditCard, bgClass: "bg-brand-yellow", iconClass: "text-brand-yellow-foreground",
      title: "Estados de Pago",
      desc: "Control completo del ciclo de facturación y aprobaciones entre mandantes y contratistas.",
      items: ["Flujo de aprobación multi-persona", "Notificaciones automáticas", "Control de vencimientos", "Historial de aprobaciones"],
    },
    {
      icon: MessageSquare, bgClass: "bg-primary", iconClass: "text-primary-foreground",
      title: "RFI (Solicitudes de Información)",
      desc: "Gestiona consultas técnicas con historial conversacional y seguimiento por especialidad.",
      items: ["Historial conversacional completo", "Reenvío a especialistas", "Adjuntos múltiples", "Exportación a PDF"],
    },
    {
      icon: PlusCircle, bgClass: "bg-brand-yellow", iconClass: "text-brand-yellow-foreground",
      title: "Adicionales",
      desc: "Controla trabajos adicionales con workflow de estados y seguimiento financiero completo.",
      items: ["Workflow de estados (Enviado→Aprobado)", "Historial de revisiones", "Control financiero detallado", "Exportación a PDF"],
    },
    {
      icon: Calculator, bgClass: "bg-primary", iconClass: "text-primary-foreground",
      title: "Presupuesto",
      desc: "Controla el avance físico y financiero de tu proyecto con gráficos y reportes detallados.",
      items: ["Avance parcial y acumulado", "Actualización masiva de ítems", "Historial de cambios", "Gráficos de evolución"],
    },
    {
      icon: FolderOpen, bgClass: "bg-brand-yellow", iconClass: "text-brand-yellow-foreground",
      title: "Documentos",
      desc: "Centraliza toda la documentación del proyecto con organización automática y acceso seguro.",
      items: ["Organización automática por proyecto", "Soporte múltiples formatos (PDF, DWG, etc.)", "Descarga directa"],
    },
    {
      icon: Camera, bgClass: "bg-primary", iconClass: "text-primary-foreground",
      title: "Fotos",
      desc: "Documenta visualmente el avance de obra con galería organizada y carga masiva de imágenes.",
      items: ["Galería visual organizada", "Carga masiva de imágenes", "Organización por proyecto", "Documentación de avance"],
    },
  ],
  licitaciones: [
    {
      icon: Brain, bgClass: "bg-brand-yellow", iconClass: "text-brand-yellow-foreground",
      title: "Creación con IA",
      desc: "Describe tu proyecto en lenguaje natural y el sistema genera la licitación completa: itemizado, calendario y documentos.",
      items: ["IA conversacional para crear licitaciones", "Generación automática de itemizado", "Análisis de especificaciones técnicas", "Creación en minutos"],
    },
    {
      icon: FileText, bgClass: "bg-primary", iconClass: "text-primary-foreground",
      title: "Itemizado Dinámico",
      desc: "Genera itemizados jerárquicos fieles a tus especificaciones técnicas, editables online.",
      items: ["Jerarquía fiel a tus EETT", "Cantidades, unidades y precios unitarios", "Importa desde Excel o crea con IA", "Edición colaborativa online"],
    },
    {
      icon: Users, bgClass: "bg-brand-yellow", iconClass: "text-brand-yellow-foreground",
      title: "Gestión de Oferentes",
      desc: "Invita, notifica y gestiona oferentes con acceso controlado a cada licitación.",
      items: ["Invitaciones por email automáticas", "Acceso seguro por OTP", "Seguimiento de envíos", "Comunicación centralizada"],
    },
    {
      icon: MessageSquare, bgClass: "bg-primary", iconClass: "text-primary-foreground",
      title: "Rondas de Preguntas",
      desc: "Los oferentes envían consultas. La IA sugiere respuestas desde tus documentos técnicos.",
      items: ["Q&A estructurado por rondas", "Respuestas sugeridas por IA", "Agrupación de preguntas similares", "Publicación selectiva"],
    },
    {
      icon: BarChart3, bgClass: "bg-brand-yellow", iconClass: "text-brand-yellow-foreground",
      title: "Comparación de Ofertas",
      desc: "Visualiza y compara ofertas lado a lado. Precios, totales y documentación en una sola vista.",
      items: ["Comparación lado a lado", "Detección de desviaciones de precio", "Cherry picking automático", "Exportación de análisis"],
    },
    {
      icon: FolderOpen, bgClass: "bg-primary", iconClass: "text-primary-foreground",
      title: "Documentación Centralizada",
      desc: "Todos los documentos de la licitación organizados: bases, EETT, planos y ofertas.",
      items: ["Repositorio por licitación", "Carga masiva de documentos", "Acceso controlado por rol", "Integración con Google Drive"],
    },
  ],
};

const profilesContent = {
  subcontratos: {
    mandante: {
      badge: "Para Mandantes",
      title: "Control Total de tus Proyectos",
      subtitle: "Herramientas avanzadas para recibir, revisar y gestionar estados de pagos de múltiples proyectos",
      features: [
        { icon: Shield, title: "Aprobaciones Inteligentes", text: "Sistema de aprobación de estados de pago con niveles de autorización y notificaciones automáticas." },
        { icon: BarChart3, title: "Reportes Ejecutivos", text: "Resúmenes ejecutivos con métricas clave, registro histórico de documentación y análisis por proyecto y contratista." },
        { icon: DollarSign, title: "Gestión Financiera", text: "Control sobre montos totales, aprobados, rechazados, fechas de vencimiento y notificaciones automáticas a contratistas." },
      ],
    },
    contratista: {
      badge: "Para Contratistas",
      title: "Simplifica tu Gestión de estados de pago",
      subtitle: "Herramientas diseñadas para que los contratistas gestionen sus estados de pagos de manera eficiente",
      features: [
        { icon: Upload, title: "Carga de Documentos Simplificada", text: "Prepara los estados de pago, consigue y carga la documentación complementaria desde un solo lugar." },
        { icon: BarChart3, title: "Dashboard de Proyectos", text: "Visualiza todos tus proyectos, estados de pago pendientes, aprobados y rechazados en una interfaz clara e intuitiva." },
        { icon: Calendar, title: "Seguimiento en Tiempo Real", text: "Recibe notificaciones instantáneas sobre cambios de estado y/o requerimientos adicionales de documentación." },
      ],
    },
  },
  licitaciones: {
    mandante: {
      badge: "Para Mandantes",
      title: "Gestiona tus Licitaciones con Control Total",
      subtitle: "Crea licitaciones, invita oferentes, gestiona preguntas y compara ofertas desde un solo panel",
      features: [
        { icon: Brain, title: "Creación Asistida por IA", text: "Describe tu proyecto y la IA genera el itemizado, calendario y estructura de la licitación automáticamente." },
        { icon: BarChart3, title: "Comparación Inteligente", text: "Compara ofertas lado a lado con detección automática de desviaciones y cherry picking de mejores precios." },
        { icon: Shield, title: "Control de Acceso", text: "Cada oferente accede solo a lo que le corresponde. Trazabilidad completa de cada acción." },
      ],
    },
    contratista: {
      badge: "Para Oferentes",
      title: "Participa en Licitaciones de Forma Simple",
      subtitle: "Accede a las licitaciones, completa tu oferta online y haz seguimiento de todo el proceso",
      features: [
        { icon: Upload, title: "Oferta Online", text: "Completa tu itemizado con precios unitarios, adjunta documentación y envía tu oferta desde la plataforma." },
        { icon: MessageSquare, title: "Preguntas y Respuestas", text: "Envía consultas técnicas y recibe respuestas publicadas por el mandante, todo con trazabilidad." },
        { icon: Calendar, title: "Calendario y Plazos", text: "Visualiza los hitos de la licitación, fechas de cierre y rondas de preguntas en un calendario integrado." },
      ],
    },
  },
};

const MKT = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [mode, setMode] = useState<ProductMode>("subcontratos");

  const handleDemoClick = () => {
    window.open("https://loom.com/share/folder/a4fd94baeb5642bcb1339ced7936e4b5", "_blank");
  };
  const handleHomeClick = () => {
    window.open("https://gloster-project-hub.lovable.app/", "_blank");
  };
  const handleKnowPlatformClick = () => {
    setIsContactModalOpen(true);
  };

  const hero = heroContent[mode];
  const problem = problemContent[mode];
  const tools = toolsContent[mode];
  const profiles = profilesContent[mode];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="bg-brand-yellow w-16 h-16 rounded-lg flex items-center justify-center">
                <Building className="w-8 h-8 text-brand-yellow-foreground" />
              </div>
            </div>

            {/* Product Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
                <button
                  onClick={() => setMode("subcontratos")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    mode === "subcontratos"
                      ? "bg-brand-yellow text-brand-yellow-foreground shadow-lg"
                      : "text-primary-foreground/70 hover:text-primary-foreground"
                  }`}
                >
                  <HardHat className="w-4 h-4" />
                  Subcontratos
                </button>
                <button
                  onClick={() => setMode("licitaciones")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    mode === "licitaciones"
                      ? "bg-brand-yellow text-brand-yellow-foreground shadow-lg"
                      : "text-primary-foreground/70 hover:text-primary-foreground"
                  }`}
                >
                  <Gavel className="w-4 h-4" />
                  Licitaciones
                </button>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{hero.title}</h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">{hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-brand-yellow text-brand-yellow-foreground hover:bg-brand-yellow/90 px-8 py-4 text-lg"
                onClick={handleHomeClick}
              >
                Conocer la Plataforma
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg"
                onClick={handleDemoClick}
              >
                Ver Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                style={{ backgroundColor: "#c7c7c7" }}
                className="border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg"
                onClick={handleKnowPlatformClick}
              >
                Solicitar cotización
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {hero.stats.map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold text-brand-yellow mb-2">{s.value}</div>
                <div className="text-sm text-primary-foreground/80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">{problem.title}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{problem.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {problem.cards.map((card, i) => (
              <Card key={i} className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <card.icon className="w-12 h-12 text-destructive mb-4" />
                  <CardTitle className="text-destructive">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{card.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">La Solución que Necesitas</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {mode === "subcontratos"
                ? "Una plataforma integral que centraliza, automatiza y optimiza toda la gestión de los estados de pagos"
                : "Una plataforma con IA que centraliza, automatiza y optimiza todo el proceso de licitación"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-3xl font-bold mb-6">
                {mode === "subcontratos" ? "Automatización Completa" : "Inteligencia Artificial Aplicada"}
              </h3>
              <div className="space-y-4">
                {mode === "subcontratos" ? (
                  <>
                    <SolutionItem title="Notificaciones Automáticas" text="Manten una comunicación clara entre mandante y contratista notificando automáticamente sobre los estados de pago." />
                    <SolutionItem title="Gestión de Documentos" text="Carga, organización y descarga automática de documentos con registro histórico de la información." />
                    <SolutionItem title="Trazabilidad Total" text="Registro completo de todas las acciones, cambios de estado y comunicaciones del proyecto." />
                  </>
                ) : (
                  <>
                    <SolutionItem title="Creación Asistida" text="Describe tu proyecto y la IA genera automáticamente el itemizado, calendario y estructura de la licitación." />
                    <SolutionItem title="Respuestas Inteligentes" text="La IA analiza tus documentos técnicos y sugiere respuestas a las consultas de los oferentes." />
                    <SolutionItem title="Análisis de Ofertas" text="Comparación automática de ofertas con detección de desviaciones y cherry picking de mejores precios." />
                  </>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-muted to-muted/50 rounded-2xl p-8 relative">
              <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {mode === "subcontratos" ? "Dashboard Principal" : "Panel de Licitaciones"}
                  </span>
                </div>
                <div className="rounded overflow-hidden">
                  <img
                    src={homeImage}
                    alt={mode === "subcontratos" ? "Dashboard Principal de la Plataforma" : "Panel de Licitaciones"}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Suite Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="bg-brand-yellow text-brand-yellow-foreground mb-4">Suite Completa</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6">Herramientas que Transforman tu Gestión</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Todo lo que necesitas para {mode === "subcontratos" ? "gestionar tus proyectos de construcción" : "gestionar tus procesos de licitación"} en un solo lugar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool, i) => (
              <Card key={i} className="border-2 hover:border-brand-yellow/50 transition-colors">
                <CardHeader>
                  <div className={`${tool.bgClass} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                    <tool.icon className={`w-7 h-7 ${tool.iconClass}`} />
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm mb-4">{tool.desc}</p>
                  <div className="space-y-2">
                    {tool.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-brand-yellow flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mandante Profile Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="bg-primary text-primary-foreground mb-4">{profiles.mandante.badge}</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6">{profiles.mandante.title}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{profiles.mandante.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="bg-white rounded-2xl shadow-lg p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">
                  {mode === "subcontratos" ? "Dashboard Ejecutivo" : "Panel de Licitaciones"}
                </h4>
                <Badge variant="secondary">Vista Real</Badge>
              </div>
              <Carousel className="w-full">
                <CarouselContent>
                  <CarouselItem>
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={dashboardMandanteImage}
                        alt="Dashboard de Mandante"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={submissionImage}
                        alt="Vista detalle"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>

            <div className="space-y-8">
              {profiles.mandante.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                    <p className="text-muted-foreground">{feat.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contractor / Oferente Profile Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-brand-yellow/10 to-brand-yellow/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="bg-brand-yellow text-brand-yellow-foreground mb-4">{profiles.contratista.badge}</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6">{profiles.contratista.title}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{profiles.contratista.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              {profiles.contratista.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="bg-brand-yellow w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feat.icon className="w-6 h-6 text-brand-yellow-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                    <p className="text-muted-foreground">{feat.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">
                  {mode === "subcontratos" ? "Panel de Contratista" : "Vista de Oferente"}
                </h4>
                <Badge variant="secondary">Vista Real</Badge>
              </div>
              <Carousel className="w-full">
                <CarouselContent>
                  <CarouselItem>
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={dashboardContratistaImage}
                        alt="Dashboard de Contratista"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={payment1Image}
                        alt="Vista detalle"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {mode === "subcontratos" ? (
              <>
                Revoluciona la Gestión de <br />
                <span className="text-brand-yellow">Pagos en Construcción</span>
              </>
            ) : (
              <>
                Simplifica tus <br />
                <span className="text-brand-yellow">Licitaciones con IA</span>
              </>
            )}
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            {mode === "subcontratos"
              ? "Únete a las empresas que ya optimizaron su gestión documental y mejoraron la eficiencia de sus proyectos."
              : "Únete a las empresas que ya digitalizaron sus procesos de licitación y toman mejores decisiones."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-brand-yellow text-brand-yellow-foreground hover:bg-brand-yellow/90 px-8 py-4 text-lg"
              onClick={handleHomeClick}
            >
              Conocer la Plataforma
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg"
              onClick={handleDemoClick}
            >
              Ver Demo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg"
              onClick={handleKnowPlatformClick}
            >
              Solicitar cotización
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Acceso Multiplataforma
              </h3>
              <p className="text-primary-foreground/80 text-sm">
                Disponible en web y dispositivos móviles. Gestiona tus proyectos desde cualquier lugar.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Seguridad Empresarial
              </h3>
              <p className="text-primary-foreground/80 text-sm">
                Encriptación de datos, backups automáticos y cumplimiento de estándares de seguridad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-muted/30 border-t">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-brand-yellow w-12 h-12 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-brand-yellow-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground">
            © 2024 Plataforma de Gestión de Pagos. Transformando la industria de la construcción.
          </p>
        </div>
      </footer>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
};

const SolutionItem = ({ title, text }: { title: string; text: string }) => (
  <div className="flex items-start gap-3">
    <CheckCircle className="w-6 h-6 text-brand-yellow flex-shrink-0 mt-1" />
    <div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-muted-foreground">{text}</p>
    </div>
  </div>
);

export default MKT;
