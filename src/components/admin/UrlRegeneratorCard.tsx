import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRegenerateUrls } from "@/hooks/useRegenerateUrls";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const UrlRegeneratorCard = () => {
  const { regenerateAllUrls, loading } = useRegenerateUrls();

  const handleRegenerate = async () => {
    const confirmed = confirm(
      "¿Estás seguro de que quieres regenerar todas las URLs de acceso? " +
      "Esto invalidará todos los enlaces existentes y generará nuevos."
    );
    
    if (confirmed) {
      await regenerateAllUrls();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Regenerar URLs de Acceso
        </CardTitle>
        <CardDescription>
          Regenera todas las URLs de acceso para contratistas y mandantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta acción regenerará todas las URLs de acceso existentes. 
            Los enlaces anteriores dejarán de funcionar.
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={handleRegenerate}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Regenerando URLs...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerar Todas las URLs
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};