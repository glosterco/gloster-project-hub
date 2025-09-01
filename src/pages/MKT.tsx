import { Building, FileText, Clock, Shield, Users, CheckCircle, ArrowRight, BarChart3, Calendar, DollarSign, Download, Upload, Monitor, Smartphone, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MKT = () => {
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
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Gestión documental <br />
              <span className="text-brand-yellow">Inteligente</span> para la Construcción
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
              La plataforma que revoluciona la gestión de estados de pagos entre mandantes y contratistas. 
              Automatiza procesos, reduce tiempos y elimina errores.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-brand-yellow text-brand-yellow-foreground hover:bg-brand-yellow/90 px-8 py-4 text-lg">
                Conocer la Plataforma
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg">
                Ver Demo
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold text-brand-yellow mb-2">Reduce</div>
              <div className="text-sm text-primary-foreground/80">Tiempos de gestión y revisión</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold text-brand-yellow mb-2">Mejora</div>
              <div className="text-sm text-primary-foreground/80">Trazabilidad y orden documental</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold text-brand-yellow mb-2">Evita</div>
              <div className="text-sm text-primary-foreground/80">Errores de comunicación</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              ¿Te suena familiar?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Los problemas más comunes en la gestión documental de estados de pagos en la construcción
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <Clock className="w-12 h-12 text-destructive mb-4" />
                <CardTitle className="text-destructive">Retrasos Constantes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Semanas esperando aprobaciones, documentos perdidos en emails, 
                  y procesos manuales que enlentecen todo el flujo de trabajo.
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <FileText className="w-12 h-12 text-destructive mb-4" />
                <CardTitle className="text-destructive">Documentación Desorganizada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Facturas en diferentes formatos, estados de pago confusos, 
                  y desorden en los documentos críticos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <Users className="w-12 h-12 text-destructive mb-4" />
                <CardTitle className="text-destructive">Comunicación Fragmentada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  WhatsApp, emails, llamadas... Información dispersa que genera 
                  malentendidos y errores costosos.
                </p>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                  <FolderTree className="w-12 h-12 text-destructive mb-4" />
                <CardTitle className="text-destructive">Falta de trazabilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Muchas versiones y desorganización de la documentación. Envíos reiterados 
                  de información pierden el orden y los registros
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              La Solución que Necesitas
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Una plataforma integral que centraliza, automatiza y optimiza toda la gestión de los estados de pagos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-3xl font-bold mb-6">Automatización Completa</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-brand-yellow flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Notificaciones Automáticas</h4>
                    <p className="text-muted-foreground">Manten una comunicación clara entre mandante y contratisa notificando automáticamente sobre estados de pago y documentos requeridos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-brand-yellow flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Gestión de Documentos</h4>
                    <p className="text-muted-foreground">Carga, organización y descarga automática de documentos con registro historico de la información.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-brand-yellow flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Trazabilidad Total</h4>
                    <p className="text-muted-foreground">Registro completo de todas las acciones, cambios de estado y comunicaciones del proyecto.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-muted to-muted/50 rounded-2xl p-8 relative">
              <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Dashboard Principal</span>
                </div>
                <div className="h-32 bg-gradient-to-r from-primary/10 to-brand-yellow/10 rounded"></div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-brand-yellow" />
                  <span className="text-sm font-medium">Gestión de Documentos</span>
                </div>
                <div className="h-20 bg-gradient-to-r from-brand-yellow/10 to-primary/10 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contractor Profile Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-brand-yellow/10 to-brand-yellow/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="bg-brand-yellow text-brand-yellow-foreground mb-4">Para Contratistas</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Simplifica tu Gestión de estados de pago
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Herramientas diseñadas para que los contratistas gestionen sus estados de pagos de manera eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-brand-yellow w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Upload className="w-6 h-6 text-brand-yellow-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Carga de Documentos Simplificada</h3>
                  <p className="text-muted-foreground">
                    Prepara los estados de pago, consigue y carga todos los documentos complementarios directamente desde <b>un solo lugar.</b>
                    El sistema valida automáticamente formatos y tamaños.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand-yellow w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-brand-yellow-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Dashboard de Proyectos</h3>
                  <p className="text-muted-foreground">
                    Visualiza todos tus proyectos, estados de pago pendientes, aprobados y rechazados 
                    en una <b>interfaz clara e intuitiva.</b>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand-yellow w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-brand-yellow-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Seguimiento en Tiempo Real</h3>
                  <p className="text-muted-foreground">
                    Recibe <b>notificaciones instantáneas</b> sobre cambios de estado, aprobaciones 
                    y requerimientos adicionales de documentación.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Panel de Contratista</h4>
                <Badge variant="secondary">En Vivo</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Proyecto Torre Norte</span>
                  <Badge className="bg-brand-yellow text-brand-yellow-foreground">Pendiente</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Edificio Central</span>
                  <Badge variant="secondary">Aprobado</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Complejo Sur</span>
                  <Badge variant="outline">En Revisión</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mandante Profile Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="bg-primary text-primary-foreground mb-4">Para Mandantes</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Control Total de tus Proyectos
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Herramientas avanzadas para recibir, revistar y gestionar estados de pagos de múltiples proyectos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="bg-white rounded-2xl shadow-lg p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Dashboard Ejecutivo</h4>
                <Badge variant="secondary">Vista Gerencial</Badge>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pagos Pendientes</span>
                  <span className="font-bold text-lg">$2.4M</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Proyectos Activos</span>
                  <span className="font-bold text-lg">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Documentos por Revisar</span>
                  <span className="font-bold text-lg">8</span>
                </div>
                <div className="h-20 bg-gradient-to-r from-primary/10 to-brand-yellow/10 rounded mt-4"></div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Aprobaciones Inteligentes</h3>
                  <p className="text-muted-foreground">
                    Sistema de aprobación de estados de pago pagos con múltiples niveles de autorización, 
                    validación automática y notificaciones automáticas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Reportes Ejecutivos</h3>
                  <p className="text-muted-foreground">
                    Resúmenes ejecutivos con métricas clave, tendencias de pago, registro historico de documentación y
                    análisis por proyecto y contratista.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Gestión Financiera</h3>
                  <p className="text-muted-foreground">
                    Control sobre montos totales, aprobados, rechazados, fechas de vencimiento y notificaciones automáticas a contratistas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Revoluciona la Gestión de <br />
            <span className="text-brand-yellow">Pagos en Construcción</span>
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Únete a las empresas que ya optimizaron su gestión documental 
            y mejoraron la eficiencia de sus proyectos.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-brand-yellow text-brand-yellow-foreground hover:bg-brand-yellow/90 px-8 py-4 text-lg">
              Conocer la plataforma
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg">
              Ver Demo
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
    </div>
  );
};

export default MKT;