import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone } from "lucide-react";
import { useEarlyAdopters } from "@/hooks/useEarlyAdopters";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const { submitEmail, isLoading } = useEarlyAdopters();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const success = await submitEmail(email.trim());
    if (success) {
      setEmail("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Contacta con Nosotros</DialogTitle>
          <DialogDescription className="text-center">
            Para obtener más información sobre la plataforma, puedes contactarnos directamente o dejarnos tu email.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">soporte.gloster@gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Teléfonos</p>
                <p className="text-sm text-muted-foreground">+56962405810</p>
                <p className="text-sm text-muted-foreground">+56973986945</p>
              </div>
            </div>
          </div>

          {/* Email Form */}
          <div className="border-t pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">O déjanos tu email para contactarte</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? "Enviando..." : "Enviar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;