import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Building2, Crown } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Free Pilot",
      duration: "(3 meses)",
      smallProjects: "$0",
      mediumProjects: "$0",
      largeProjects: "Por definir",
      projects: "1 proyecto",
      isPopular: false,
      icon: Star,
    },
    {
      name: "Plan Starter",
      duration: "",
      smallProjects: "$70k/mes",
      mediumProjects: "$100k/mes",
      largeProjects: "Por definir",
      projects: "Hasta 3 proyectos",
      isPopular: false,
      icon: Zap,
    },
    {
      name: "Plan Pro",
      duration: "",
      smallProjects: "$150k/mes",
      mediumProjects: "$200k/mes",
      largeProjects: "Por definir",
      projects: "Hasta 5 proyectos",
      isPopular: false,
      icon: Building2,
    },
    {
      name: "Plan Enterprise",
      duration: "",
      smallProjects: "Contactar",
      mediumProjects: "Contactar",
      largeProjects: "Por definir",
      projects: "Variable",
      isPopular: false,
      icon: Crown,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gloster-yellow text-black px-4 py-2 rounded-full mb-4">
            <Building2 className="h-5 w-5" />
            <span className="font-medium">Planes para Contratistas</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Impulsa tu negocio con el plan perfecto
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte al tamaño de tus proyectos y necesidades de negocio
          </p>
        </div>

        <Card className="max-w-6xl mx-auto shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-gloster-yellow/10 rounded-t-lg">
            <CardTitle className="text-2xl text-center text-foreground">
              Comparación de Planes
            </CardTitle>
            <CardDescription className="text-center">
              El tamaño de proyectos se define según usuarios, valor total del contrato y almacenamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gloster-yellow/20">
                     <TableHead className="font-semibold text-foreground">Plan</TableHead>
                     <TableHead className="text-center font-semibold text-foreground">
                       Proyectos Pequeños
                     </TableHead>
                     <TableHead className="text-center font-semibold text-foreground">
                       Proyectos Medianos
                     </TableHead>
                     <TableHead className="text-center font-semibold text-foreground">
                       Proyectos Grandes
                     </TableHead>
                     <TableHead className="text-center font-semibold text-foreground">
                       Cantidad de Proyectos
                     </TableHead>
                     <TableHead className="text-center font-semibold text-foreground">
                       Acción
                     </TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {plans.map((plan, index) => (
                    <TableRow key={index} className="hover:bg-gloster-yellow/5 border-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-gloster-yellow text-black">
                             <plan.icon className="h-4 w-4" />
                           </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{plan.name}</span>
                              {plan.duration && (
                                <span className="text-sm text-muted-foreground">
                                  {plan.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                       <TableCell className="text-center font-semibold text-lg">
                         <span className="text-foreground">
                           {plan.smallProjects}
                         </span>
                       </TableCell>
                       <TableCell className="text-center font-semibold text-lg">
                         <span className="text-foreground">
                           {plan.mediumProjects}
                         </span>
                       </TableCell>
                       <TableCell className="text-center font-semibold text-lg">
                         <span className="text-foreground">
                           {plan.largeProjects}
                         </span>
                       </TableCell>
                       <TableCell className="text-center">
                         <div className="flex items-center justify-center gap-2">
                           <Check className="h-4 w-4 text-black bg-gloster-yellow rounded-full p-0.5" />
                           <span className="font-medium">{plan.projects}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Button 
                           className="w-full max-w-28 bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
                         >
                           Contactar
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pricing;