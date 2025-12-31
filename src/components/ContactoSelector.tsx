import React, { useState } from 'react';
import { Contacto } from '@/hooks/useContactos';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Mail, Phone, Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContactoSelectorProps {
  contactos: Contacto[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  loading?: boolean;
  onAddContacto?: (contacto: Omit<Contacto, 'id' | 'created_at'>) => Promise<any>;
  projectId: string;
}

const ROLES = [
  'Arquitecto',
  'Ingeniero Estructural',
  'Ingeniero Eléctrico',
  'Ingeniero Sanitario',
  'Ingeniero Civil',
  'Calculista',
  'Inspector',
  'Supervisor',
  'Coordinador',
  'Especialista',
  'Otro'
];

export const ContactoSelector: React.FC<ContactoSelectorProps> = ({
  contactos,
  selectedIds,
  onSelectionChange,
  loading,
  onAddContacto,
  projectId
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newContacto, setNewContacto] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: '',
    especialidad: ''
  });

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleAddContacto = async () => {
    if (!onAddContacto || !newContacto.nombre || !newContacto.email || !newContacto.rol) return;
    
    const pid = parseInt(projectId);
    if (Number.isNaN(pid)) {
      console.error('❌ ContactoSelector: projectId inválido:', projectId);
      return;
    }
    
    setIsAdding(true);
    try {
      await onAddContacto({
        proyecto_id: pid,
        nombre: newContacto.nombre,
        email: newContacto.email,
        telefono: newContacto.telefono || null,
        rol: newContacto.rol,
        especialidad: newContacto.especialidad || null
      });
      setNewContacto({ nombre: '', email: '', telefono: '', rol: '', especialidad: '' });
      setShowAddDialog(false);
    } catch (error) {
      console.error('❌ Error adding contacto:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Seleccionar especialistas</Label>
        {onAddContacto && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Agregar contacto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar nuevo contacto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={newContacto.nombre}
                    onChange={(e) => setNewContacto(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newContacto.email}
                    onChange={(e) => setNewContacto(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={newContacto.telefono}
                    onChange={(e) => setNewContacto(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rol *</Label>
                  <Select
                    value={newContacto.rol}
                    onValueChange={(value) => setNewContacto(prev => ({ ...prev, rol: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((rol) => (
                        <SelectItem key={rol} value={rol}>{rol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Especialidad</Label>
                  <Input
                    value={newContacto.especialidad}
                    onChange={(e) => setNewContacto(prev => ({ ...prev, especialidad: e.target.value }))}
                    placeholder="Ej: Diseño sísmico"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAddContacto}
                    disabled={isAdding || !newContacto.nombre || !newContacto.email || !newContacto.rol}
                  >
                    {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Agregar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {contactos.length === 0 ? (
        <Card className="p-4 text-center text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay contactos registrados para este proyecto</p>
          {onAddContacto && (
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setShowAddDialog(true)}
              className="mt-2"
            >
              Agregar el primer contacto
            </Button>
          )}
        </Card>
      ) : (
        <ScrollArea className="h-[200px] border rounded-md">
          <div className="p-2 space-y-2">
            {contactos.map((contacto) => (
              <div
                key={contacto.id}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedIds.includes(contacto.id)
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleToggle(contacto.id)}
              >
                <Checkbox
                  checked={selectedIds.includes(contacto.id)}
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={() => handleToggle(contacto.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{contacto.nombre}</span>
                    <Badge variant="outline" className="text-xs">
                      {contacto.rol}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contacto.email}
                    </span>
                    {contacto.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contacto.telefono}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} especialista(s) seleccionado(s)
        </p>
      )}
    </div>
  );
};
