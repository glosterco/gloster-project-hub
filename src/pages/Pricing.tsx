import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Free Pilot",
      duration: "(3 meses)",
      smallProjects: "$0 por primer proyecto",
      mediumProjects: "$0 por primer proyecto",
      projects: "1 proyecto",
      isPopular: false,
    },
    {
      name: "Plan Starter",
      duration: "",
      smallProjects: "$70k/mes",
      mediumProjects: "$100k/mes",
      projects: "Hasta 3 proyectos",
      isPopular: true,
    },
    {
      name: "Plan Pro",
      duration: "",
      smallProjects: "$150k/mes",
      mediumProjects: "$200k/mes",
      projects: "Hasta 5 proyectos",
      isPopular: false,
    },
    {
      name: "Plan Enterprise",
      duration: "",
      smallProjects: "Contactar",
      mediumProjects: "Contactar",
      projects: "Variable",
      isPopular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Planes para Contratistas
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte al tamaño de tus proyectos y necesidades de negocio
          </p>
        </div>

        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Comparación de Planes</CardTitle>
            <CardDescription className="text-center">
              El tamaño de proyectos se define según usuarios, valor total del contrato y almacenamiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Plan</TableHead>
                    <TableHead className="text-center font-semibold">
                      Proyectos Pequeños
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      Proyectos Medianos
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      Cantidad de Proyectos
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      Acción
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{plan.name}</span>
                          {plan.duration && (
                            <span className="text-sm text-muted-foreground">
                              {plan.duration}
                            </span>
                          )}
                          {plan.isPopular && (
                            <Badge variant="secondary" className="text-xs">
                              Más Popular
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-primary">
                        {plan.smallProjects}
                      </TableCell>
                      <TableCell className="text-center font-medium text-primary">
                        {plan.mediumProjects}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>{plan.projects}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {plan.name === "Free Pilot" ? (
                          <Button variant="outline" className="w-full max-w-24">
                            Empezar
                          </Button>
                        ) : plan.name === "Plan Enterprise" ? (
                          <Button variant="secondary" className="w-full max-w-24">
                            Contactar
                          </Button>
                        ) : (
                          <Button 
                            variant={plan.isPopular ? "default" : "outline"} 
                            className="w-full max-w-24"
                          >
                            Elegir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proyectos Pequeños</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Hasta 5 usuarios</li>
                <li>• Valor del contrato hasta $50M</li>
                <li>• 10GB de almacenamiento</li>
                <li>• Soporte básico</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proyectos Medianos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Hasta 15 usuarios</li>
                <li>• Valor del contrato hasta $200M</li>
                <li>• 50GB de almacenamiento</li>
                <li>• Soporte prioritario</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enterprise</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Usuarios ilimitados</li>
                <li>• Sin límite de valor</li>
                <li>• Almacenamiento personalizado</li>
                <li>• Soporte dedicado 24/7</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;