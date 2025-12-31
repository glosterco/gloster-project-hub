import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, HelpCircle } from "lucide-react";
import { RFIDetailModal } from "@/components/RFIDetailModal";
import type { RFI } from "@/hooks/useRFI";

type AccessData = {
  projectId?: string | null;
  accessToken?: string | null;
  email?: string | null;
  userType?: string | null;
  rfiId?: string | null;
  adicionalId?: string | null;
};

type ProjectLite = {
  id: number;
  Name: string | null;
  URL: string | null;
  Contratistas?: {
    CompanyName: string;
    ContactEmail: string | null;
    ContactName: string | null;
  } | null;
  Mandantes?: {
    CompanyName: string;
    ContactEmail: string | null;
    ContactName: string | null;
  } | null;
};

const ProjectAccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlRfiId = searchParams.get("rfiId");

  const [project, setProject] = useState<ProjectLite | null>(null);
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [showRFIDetailModal, setShowRFIDetailModal] = useState(false);

  const access = useMemo<AccessData | null>(() => {
    const raw = sessionStorage.getItem("contractorAccess") || sessionStorage.getItem("mandanteAccess");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const pid = Number(id);
    if (!id || Number.isNaN(pid)) {
      setLoading(false);
      return;
    }

    // SEO (mínimo viable sin react-helmet)
    document.title = `Acceso a RFI | Proyecto ${id}`;

    const load = async () => {
      try {
        // Vista "limitada" sin sesión Supabase: solo lectura.
        const { data: projectData, error: projectError } = await supabase
          .from("Proyectos" as any)
          .select(
            `
            id,
            Name,
            URL,
            Contratistas:Contratistas!Proyectos_Contratista_fkey (
              CompanyName,
              ContactEmail,
              ContactName
            ),
            Mandantes:Mandantes!Proyectos_Owner_fkey (
              CompanyName,
              ContactEmail,
              ContactName
            )
          `,
          )
          .eq("id", pid)
          .maybeSingle();

        if (projectError) {
          console.error("❌ ProjectAccess: error fetching project", projectError);
        }

        setProject((projectData as any) || null);

        const { data: rfiData, error: rfiError } = await supabase
          .from("RFI" as any)
          .select("*")
          .eq("Proyecto", pid)
          .order("created_at", { ascending: false });

        if (rfiError) {
          console.error("❌ ProjectAccess: error fetching RFI", rfiError);
        }

        setRfis((rfiData as any) || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // Deep link: abrir modal automáticamente
  useEffect(() => {
    if (!urlRfiId || rfis.length === 0) return;
    const target = rfis.find((r) => r.id === Number(urlRfiId));
    if (target) {
      setSelectedRFI(target);
      setShowRFIDetailModal(true);
    }
  }, [urlRfiId, rfis]);

  const hasTokenAccess = !!access?.accessToken && (access?.projectId === id || access?.projectId === String(id));

  if (!hasTokenAccess) {
    return (
      <main className="min-h-screen bg-slate-50 font-rubik">
        <header className="bg-white border-b border-gloster-gray/20 shadow-sm">
          <div className="container mx-auto px-6 py-4 flex items-center gap-3">
            <img
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png"
              alt="Gloster logo"
              className="w-8 h-8"
              loading="lazy"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Acceso por enlace</h1>
          </div>
        </header>

        <section className="container mx-auto px-6 py-10">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="text-slate-800 font-rubik">Este enlace requiere verificación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para ver el RFI, primero debes verificar tu email desde la pantalla de acceso.
              </p>
              <Button onClick={() => navigate("/email-access")} className="w-full">
                Ir a verificación
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-rubik">
      <header className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png"
              alt="Gloster logo"
              className="w-8 h-8"
              loading="lazy"
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-800 font-rubik truncate">
                {project?.Name || `Proyecto ${id}`}
              </h1>
              <p className="text-xs text-muted-foreground truncate">Acceso por enlace (solo lectura)</p>
            </div>
          </div>

          <Button variant="outline" onClick={() => navigate("/")}
            className="shrink-0"
          >
            Volver
          </Button>
        </div>
      </header>

      <section className="container mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 font-rubik">
              <HelpCircle className="h-5 w-5" />
              RFIs del proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Cargando...</div>
            ) : rfis.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay RFIs para este proyecto.</div>
            ) : (
              <div className="space-y-3">
                {rfis.map((rfi) => (
                  <button
                    key={rfi.id}
                    type="button"
                    onClick={() => {
                      setSelectedRFI(rfi);
                      setShowRFIDetailModal(true);
                    }}
                    className="w-full text-left"
                  >
                    <div className="rounded-lg border border-border bg-background p-4 hover:bg-muted/30 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 font-rubik truncate">{rfi.Titulo || `RFI #${rfi.id}`}</p>
                          {rfi.Descripcion && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{rfi.Descripcion}</p>
                          )}
                        </div>
                        <Badge variant="secondary">{rfi.Status || "Pendiente"}</Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(rfi.created_at).toLocaleDateString("es-CL")}
                        </span>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ver detalle
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <RFIDetailModal
        open={showRFIDetailModal}
        onOpenChange={setShowRFIDetailModal}
        rfi={selectedRFI}
        // Importante: en acceso por token es solo lectura (sin responder ni reenviar)
        isMandante={false}
        onSuccess={() => {
          // No-op
        }}
      />
    </main>
  );
};

export default ProjectAccess;
