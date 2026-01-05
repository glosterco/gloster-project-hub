import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, HelpCircle, FileText, DollarSign, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { RFIDetailModal } from "@/components/RFIDetailModal";
import { AdicionalesDetailModal } from "@/components/AdicionalesDetailModal";
import { formatCurrency } from "@/utils/currencyUtils";
import type { RFI } from "@/hooks/useRFI";

type AccessData = {
  projectId?: string | number | null;
  accessToken?: string | null;
  email?: string | null;
  userType?: string | null;
  // Modo de vista: 'rfi' = solo RFIs, 'adicional' = solo adicionales, 'general' = ambos
  viewMode?: 'rfi' | 'adicional' | 'general';
  // Arrays de IDs autorizados (del backend)
  authorizedRfiIds?: number[];
  authorizedAdicionalIds?: number[];
  // IDs del deep link (para auto-abrir modal)
  deepLinkRfiId?: string | null;
  deepLinkAdicionalId?: string | null;
};

type ProjectLite = {
  id: number;
  Name: string | null;
  URL: string | null;
  Currency?: string | null;
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

type Adicional = {
  id: number;
  Titulo: string | null;
  Descripcion: string | null;
  Categoria: string | null;
  Especialidad: string | null;
  Monto_presentado: number | null;
  Monto_aprobado: number | null;
  Status: string | null;
  Vencimiento: string | null;
  created_at: string;
  Proyecto: number | null;
  Correlativo: number | null;
  GG: number | null;
  URL: string | null;
  approved_by_email: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_notes: string | null;
};

type EstadoPago = {
  id: number;
  Name: string;
  Status: string | null;
  Total: number | null;
  ExpiryDate: string | null;
  Mes: string | null;
  Año: number | null;
  approval_progress: number | null;
  total_approvals_required: number | null;
  URLMandante: string | null;
};

const getPaymentStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'enviado':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'en revisión':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'aprobado':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'rechazado':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const ProjectAccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlRfiId = searchParams.get("rfiId");
  const urlAdicionalId = searchParams.get("adicionalId");

  const [project, setProject] = useState<ProjectLite | null>(null);
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [adicionales, setAdicionales] = useState<Adicional[]>([]);
  const [estadosPago, setEstadosPago] = useState<EstadoPago[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [showRFIDetailModal, setShowRFIDetailModal] = useState(false);

  const [selectedAdicional, setSelectedAdicional] = useState<Adicional | null>(null);
  const [showAdicionalModal, setShowAdicionalModal] = useState(false);

  // Access data from session storage
  const access = useMemo<AccessData | null>(() => {
    const raw = sessionStorage.getItem("contractorAccess") || sessionStorage.getItem("mandanteAccess");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const isMandante = access?.userType === 'mandante';
  const userEmail = access?.email?.toLowerCase().trim();
  
  // Arrays de IDs autorizados (del backend)
  const authorizedRfiIds = access?.authorizedRfiIds || [];
  const authorizedAdicionalIds = access?.authorizedAdicionalIds || [];
  
  // IDs del deep link para auto-abrir modal
  const deepLinkRfiId = urlRfiId || access?.deepLinkRfiId;
  const deepLinkAdicionalId = urlAdicionalId || access?.deepLinkAdicionalId;
  
  // Modo de vista: determina qué secciones mostrar
  const viewMode = access?.viewMode || 'general';
  
  // Determinar si mostrar cada sección basado en viewMode
  const showRfiSection = viewMode === 'rfi' || viewMode === 'general';
  const showAdicionalesSection = viewMode === 'adicional' || viewMode === 'general';

  useEffect(() => {
    const pid = Number(id);
    if (!id || Number.isNaN(pid)) {
      setLoading(false);
      return;
    }

    document.title = `Acceso al Proyecto ${id}`;

    const load = async () => {
      try {
        const { data: projectData, error: projectError } = await supabase
          .from("Proyectos" as any)
          .select(
            `
            id,
            Name,
            URL,
            Currency,
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

        // ========================================
        // FILTRADO DE RFIs BASADO EN PERMISOS Y viewMode
        // ========================================
        if (showRfiSection && authorizedRfiIds.length > 0) {
          // Cargar solo los RFIs autorizados
          const { data: rfiData } = await supabase
            .from("RFI" as any)
            .select("*")
            .in("id", authorizedRfiIds)
            .eq("Proyecto", pid)
            .order("created_at", { ascending: false });
          setRfis((rfiData as any) || []);
        } else if (showRfiSection && isMandante && viewMode === 'general') {
          // Mandante con acceso general puede ver todos los RFIs del proyecto
          const { data: rfiData } = await supabase
            .from("RFI" as any)
            .select("*")
            .eq("Proyecto", pid)
            .eq("Status", "Pendiente")
            .order("created_at", { ascending: false });
          setRfis((rfiData as any) || []);
        } else {
          setRfis([]);
        }

        // ========================================
        // FILTRADO DE ADICIONALES BASADO EN PERMISOS Y viewMode
        // ========================================
        if (showAdicionalesSection && authorizedAdicionalIds.length > 0) {
          // Cargar solo los adicionales autorizados
          const { data: adicionalesData } = await supabase
            .from("Adicionales" as any)
            .select("*")
            .in("id", authorizedAdicionalIds)
            .eq("Proyecto", pid)
            .order("created_at", { ascending: false });
          setAdicionales((adicionalesData as any) || []);
        } else if (showAdicionalesSection && isMandante && viewMode === 'general') {
          // Mandante con acceso general puede ver todos los adicionales del proyecto
          const { data: adicionalesData } = await supabase
            .from("Adicionales" as any)
            .select("*")
            .eq("Proyecto", pid)
            .eq("Status", "Pendiente")
            .order("created_at", { ascending: false });
          setAdicionales((adicionalesData as any) || []);
        } else {
          setAdicionales([]);
        }

        // Estados de Pago (solo para mandante con acceso general)
        if (isMandante && viewMode === 'general') {
          const { data: pagosData, error: pagosError } = await supabase
            .from("Estados de pago" as any)
            .select("*")
            .eq("Project", pid)
            .in("Status", ["Enviado", "En Revisión"])
            .order("ExpiryDate", { ascending: true });

          if (pagosError) {
            console.error("❌ ProjectAccess: error fetching Estados de pago", pagosError);
          }
          setEstadosPago((pagosData as any) || []);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, authorizedRfiIds, authorizedAdicionalIds, isMandante, viewMode, showRfiSection, showAdicionalesSection]);

  // Deep link: abrir modal automáticamente para RFI del deep link
  useEffect(() => {
    if (!deepLinkRfiId || rfis.length === 0) return;
    const target = rfis.find((r) => r.id === Number(deepLinkRfiId));
    if (target) {
      setSelectedRFI(target);
      setShowRFIDetailModal(true);
    }
  }, [deepLinkRfiId, rfis]);

  // Deep link: abrir modal automáticamente para Adicional del deep link
  useEffect(() => {
    if (!deepLinkAdicionalId || adicionales.length === 0) return;
    const target = adicionales.find((a) => a.id === Number(deepLinkAdicionalId));
    if (target) {
      setSelectedAdicional(target);
      setShowAdicionalModal(true);
    }
  }, [deepLinkAdicionalId, adicionales]);

  // Validar acceso
  const hasTokenAccess = useMemo(() => {
    if (!access?.accessToken) return false;
    const accessProjectId = String(access.projectId);
    const urlProjectId = String(id);
    return accessProjectId === urlProjectId;
  }, [access, id]);

  const handlePaymentClick = (payment: EstadoPago) => {
    navigate(`/contractor-access/${payment.id}?userType=${access?.userType || 'contractor'}`);
  };

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
                Para acceder al contenido, primero debes verificar tu email desde la pantalla de acceso.
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
              <p className="text-xs text-muted-foreground truncate">
                Acceso por enlace {isMandante ? '(Mandante)' : '(Contratista)'}
                {viewMode === 'rfi' && ' • RFIs pendientes'}
                {viewMode === 'adicional' && ' • Adicionales pendientes'}
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={() => navigate("/")} className="shrink-0">
            Volver
          </Button>
        </div>
      </header>

      <section className="container mx-auto px-6 py-8 space-y-6">
        {/* Aviso de acceso específico */}
        {viewMode !== 'general' && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800">
                  {viewMode === 'rfi' && (
                    <><strong>RFIs pendientes:</strong> A continuación se muestran los RFIs que requieren su respuesta.</>
                  )}
                  {viewMode === 'adicional' && (
                    <><strong>Adicionales pendientes:</strong> A continuación se muestran los adicionales que requieren su aprobación.</>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estados de Pago Pendientes Section - Solo para mandante con acceso general */}
        {viewMode === 'general' && estadosPago.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 font-rubik">
                <DollarSign className="h-5 w-5 text-amber-600" />
                Estados de Pago Pendientes de Aprobación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {estadosPago.map((pago) => (
                  <button
                    key={pago.id}
                    type="button"
                    onClick={() => handlePaymentClick(pago)}
                    className="w-full text-left"
                  >
                    <div className="rounded-lg border border-amber-200 bg-white p-4 hover:bg-amber-50/50 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 font-rubik truncate">
                            {pago.Name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {pago.Mes} {pago.Año}
                          </p>
                          {pago.Total && (
                            <p className="text-lg font-bold text-primary mt-1">
                              {formatCurrency(pago.Total, project?.Currency || 'CLP')}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getPaymentStatusColor(pago.Status)}>
                            {pago.Status || "Pendiente"}
                          </Badge>
                          {pago.total_approvals_required && pago.total_approvals_required > 1 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CheckCircle className="h-3.5 w-3.5" />
                              {pago.approval_progress || 0}/{pago.total_approvals_required} aprobaciones
                            </div>
                          )}
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between gap-3">
                        {pago.ExpiryDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Vence: {new Date(pago.ExpiryDate).toLocaleDateString("es-CL")}
                          </span>
                        )}
                        <span className="text-xs text-amber-600 font-medium inline-flex items-center gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Revisar y aprobar
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* RFIs Section - Solo si viewMode es 'rfi' o 'general' */}
        {showRfiSection && rfis.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 font-rubik">
                <HelpCircle className="h-5 w-5" />
                {viewMode === 'rfi' ? 'RFIs pendientes de respuesta' : 'RFIs del proyecto'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Cargando...</div>
              ) : rfis.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No hay RFIs pendientes.
                </div>
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
                            {isMandante ? 'Ver y responder' : 'Ver detalle'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Adicionales Section - Solo si viewMode es 'adicional' o 'general' */}
        {showAdicionalesSection && adicionales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 font-rubik">
                <FileText className="h-5 w-5" />
                {viewMode === 'adicional' ? 'Adicionales pendientes de aprobación' : 'Adicionales del proyecto'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Cargando...</div>
              ) : adicionales.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No hay adicionales pendientes.
                </div>
              ) : (
                <div className="space-y-3">
                  {adicionales.map((adicional) => (
                    <button
                      key={adicional.id}
                      type="button"
                      onClick={() => {
                        setSelectedAdicional(adicional);
                        setShowAdicionalModal(true);
                      }}
                      className="w-full text-left"
                    >
                      <div className="rounded-lg border border-border bg-background p-4 hover:bg-muted/30 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 font-rubik truncate">
                              {adicional.Titulo || `Adicional #${adicional.id}`}
                            </p>
                            {adicional.Descripcion && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{adicional.Descripcion}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {adicional.Categoria} {adicional.Especialidad && `• ${adicional.Especialidad}`}
                            </p>
                          </div>
                          <Badge variant={adicional.Status === 'Aprobado' ? 'default' : adicional.Status === 'Rechazado' ? 'destructive' : 'secondary'}>
                            {adicional.Status || "Pendiente"}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(adicional.created_at).toLocaleDateString("es-CL")}
                          </span>
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            {isMandante ? 'Ver y aprobar' : 'Ver detalle'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      <RFIDetailModal
        open={showRFIDetailModal}
        onOpenChange={setShowRFIDetailModal}
        rfi={selectedRFI}
        isMandante={isMandante}
        isContratista={!isMandante && access?.userType !== 'especialista'}
        projectId={id}
        userEmail={userEmail}
        userName={access?.email || undefined}
        onSuccess={() => {
          const pid = Number(id);
          if (!Number.isNaN(pid) && authorizedRfiIds.length > 0) {
            supabase
              .from("RFI" as any)
              .select("*")
              .in("id", authorizedRfiIds)
              .eq("Proyecto", pid)
              .order("created_at", { ascending: false })
              .then(({ data }) => setRfis((data as any) || []));
          } else if (!Number.isNaN(pid) && isMandante) {
            supabase
              .from("RFI" as any)
              .select("*")
              .eq("Proyecto", pid)
              .order("created_at", { ascending: false })
              .then(({ data }) => setRfis((data as any) || []));
          }
        }}
      />

      <AdicionalesDetailModal
        open={showAdicionalModal}
        onOpenChange={setShowAdicionalModal}
        adicional={selectedAdicional}
        isMandante={isMandante}
        currency={project?.Currency || 'CLP'}
        onSuccess={() => {
          const pid = Number(id);
          if (!Number.isNaN(pid) && authorizedAdicionalIds.length > 0) {
            supabase
              .from("Adicionales" as any)
              .select("*")
              .in("id", authorizedAdicionalIds)
              .eq("Proyecto", pid)
              .order("created_at", { ascending: false })
              .then(({ data }) => setAdicionales((data as any) || []));
          } else if (!Number.isNaN(pid) && isMandante) {
            supabase
              .from("Adicionales" as any)
              .select("*")
              .eq("Proyecto", pid)
              .order("created_at", { ascending: false })
              .then(({ data }) => setAdicionales((data as any) || []));
          }
          setShowAdicionalModal(false);
        }}
      />
    </main>
  );
};

export default ProjectAccess;
