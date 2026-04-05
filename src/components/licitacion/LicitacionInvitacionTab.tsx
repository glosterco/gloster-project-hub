import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, CheckCircle, Clock, FileText, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Oferente {
  id: number;
  email: string;
  aceptada: boolean;
  aceptada_at: string | null;
  aceptada_por_nombre: string | null;
  archivo_aceptacion_url: string | null;
  archivo_aceptacion_nombre: string | null;
  nombre_empresa: string | null;
  itemizado_enviado: boolean;
  itemizado_enviado_at: string | null;
}

interface Props {
  licitacionId: number;
  mensajeOferentes: string | null;
  oferentes: Oferente[];
  onRefresh: () => void;
}

const LicitacionInvitacionTab: React.FC<Props> = ({ licitacionId, mensajeOferentes, oferentes, onRefresh }) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const saveNombreEmpresa = async (oferenteId: number) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('LicitacionOferentes')
        .update({ nombre_empresa: editingName.trim() || null })
        .eq('id', oferenteId);
      if (error) throw error;
      setEditingId(null);
      toast({ title: "Nombre actualizado" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invitation message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-rubik">
            <Mail className="h-5 w-5" />
            Mensaje de Invitación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mensajeOferentes ? (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm whitespace-pre-wrap">{mensajeOferentes}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No se definió un mensaje de invitación.</p>
          )}
        </CardContent>
      </Card>

      {/* Oferentes list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-rubik flex items-center gap-2">
            Oferentes Invitados ({oferentes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {oferentes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay oferentes invitados.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa / Nombre</TableHead>
                    <TableHead className="text-center">Invitación</TableHead>
                    <TableHead className="text-center">Itemizado</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oferentes.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="text-sm">{o.email}</TableCell>
                      <TableCell>
                        {editingId === o.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              placeholder="Nombre empresa"
                              className="text-sm h-8 w-48"
                              onKeyDown={e => e.key === 'Enter' && saveNombreEmpresa(o.id)}
                            />
                            <Button size="sm" variant="ghost" onClick={() => saveNombreEmpresa(o.id)} disabled={saving}>
                              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        ) : (
                          <button
                            className="text-sm text-left hover:underline cursor-pointer"
                            onClick={() => {
                              setEditingId(o.id);
                              setEditingName(o.nombre_empresa || '');
                            }}
                          >
                            {o.nombre_empresa || <span className="text-muted-foreground italic">Click para asignar</span>}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {o.aceptada ? (
                          <Badge className="bg-emerald-500 text-[10px]">
                            <CheckCircle className="h-3 w-3 mr-0.5" /> Aceptada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            <Clock className="h-3 w-3 mr-0.5" /> Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {o.itemizado_enviado ? (
                          <Badge className="bg-blue-500 text-[10px]">Enviado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">No enviado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {o.aceptada && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p>Por: {o.aceptada_por_nombre}</p>
                            <p>{format(new Date(o.aceptada_at!), "d MMM yyyy HH:mm", { locale: es })}</p>
                            {o.archivo_aceptacion_url && (
                              <a href={o.archivo_aceptacion_url} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1">
                                <FileText className="h-3 w-3" /> {o.archivo_aceptacion_nombre || 'Carta'}
                              </a>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LicitacionInvitacionTab;
