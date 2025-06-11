
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Users, FileText, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gloster-gray/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Gloster</h1>
          </div>
          <Button
            onClick={() => navigate('/register')}
            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
          >
            Registrarse
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-5xl font-bold text-slate-800 leading-tight font-rubik">
            Gestiona tus contratos de construcción de forma
            <span className="text-gloster-yellow"> inteligente</span>
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed font-rubik">
            Automatiza la presentación de estados de pago, mantén control total de tus proyectos 
            y asegura el cumplimiento normativo con nuestra plataforma especializada.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik px-8 py-3 text-lg"
            >
              Comenzar Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-slate-500 italic font-rubik">
              Sin compromisos • Configuración en 5 minutos
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-slate-800 mb-4 font-rubik">
            ¿Por qué elegir Gloster?
          </h3>
          <p className="text-lg text-slate-600 font-rubik">
            Diseñado específicamente para empresas constructoras chilenas
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center mb-6">
              <FileText className="h-6 w-6 text-gloster-yellow" />
            </div>
            <h4 className="text-xl font-semibold text-slate-800 mb-4 font-rubik">
              Estados de Pago Automatizados
            </h4>
            <p className="text-slate-600 leading-relaxed font-rubik">
              Genera automáticamente toda la documentación requerida: carátulas EEPP, 
              certificados F30, comprobantes de cotizaciones y más.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="h-6 w-6 text-gloster-yellow" />
            </div>
            <h4 className="text-xl font-semibold text-slate-800 mb-4 font-rubik">
              Control Financiero Total
            </h4>
            <p className="text-slate-600 leading-relaxed font-rubik">
              Monitorea el flujo de caja, fechas de vencimiento y el estado de cada 
              proyecto en tiempo real desde un dashboard centralizado.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center mb-6">
              <CheckCircle className="h-6 w-6 text-gloster-yellow" />
            </div>
            <h4 className="text-xl font-semibold text-slate-800 mb-4 font-rubik">
              Cumplimiento Normativo
            </h4>
            <p className="text-slate-600 leading-relaxed font-rubik">
              Asegura el cumplimiento de todas las normativas laborales y tributarias 
              con validaciones automáticas y recordatorios inteligentes.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-6 py-16 bg-white/50">
        <div className="text-center space-y-8">
          <div className="flex items-center justify-center space-x-2">
            <Users className="h-6 w-6 text-gloster-yellow" />
            <span className="text-2xl font-bold text-slate-800 font-rubik">500+</span>
            <span className="text-lg text-slate-600 font-rubik">empresas constructoras confían en nosotros</span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-gloster-yellow mb-2 font-rubik">98%</div>
              <div className="text-slate-600 font-rubik">Reducción en errores de documentación</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gloster-yellow mb-2 font-rubik">15 horas</div>
              <div className="text-slate-600 font-rubik">Ahorro promedio por semana</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gloster-yellow mb-2 font-rubik">100%</div>
              <div className="text-slate-600 font-rubik">Cumplimiento normativo garantizado</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h3 className="text-3xl font-bold text-slate-800 font-rubik">
            ¿Listo para transformar tu gestión de contratos?
          </h3>
          <p className="text-lg text-slate-600 font-rubik">
            Únete a cientos de empresas que ya optimizaron sus procesos administrativos
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/register')}
            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik px-8 py-3 text-lg"
          >
            Crear Mi Cuenta Gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <span className="text-xl font-bold font-rubik">Gloster</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-slate-400 font-rubik">
                © 2024 Gloster. Todos los derechos reservados.
              </p>
              <p className="text-slate-500 text-sm font-rubik">
                Hecho con ❤️ para la industria de la construcción chilena
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
