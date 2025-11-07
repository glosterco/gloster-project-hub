import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Folder, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMandanteFolders } from '@/hooks/useMandanteFolders';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';

interface ProjectFilterProps {
  projects: { id: number; name: string }[];
  selectedProjects: number[];
  onProjectsChange: (projectIds: number[]) => void;
}

export const ProjectFilter: React.FC<ProjectFilterProps> = ({
  projects,
  selectedProjects,
  onProjectsChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const { user } = useAuth();
  const [mandanteId, setMandanteId] = React.useState<number | null>(null);
  
  // Get mandante ID from user roles
  React.useEffect(() => {
    const getUserMandanteId = async () => {
      if (!user) return;
      
      const { data: userRoles } = await (await import('@/integrations/supabase/client')).supabase
        .from('user_roles')
        .select('entity_id, role_type')
        .eq('auth_user_id', user.id)
        .eq('role_type', 'mandante')
        .single();
      
      if (userRoles) {
        setMandanteId(userRoles.entity_id);
      }
    };
    
    getUserMandanteId();
  }, [user]);

  const { folders } = useMandanteFolders(mandanteId);

  const handleSelectAll = () => {
    onProjectsChange(projects.map(p => p.id));
  };

  const handleClearAll = () => {
    onProjectsChange([]);
  };

  const handleToggleProject = (projectId: number) => {
    if (selectedProjects.includes(projectId)) {
      onProjectsChange(selectedProjects.filter(id => id !== projectId));
    } else {
      onProjectsChange([...selectedProjects, projectId]);
    }
  };

  const handleSelectFolder = (projectIds: number[]) => {
    // Add all projects from folder that aren't already selected
    const newSelected = [...new Set([...selectedProjects, ...projectIds])];
    onProjectsChange(newSelected);
    setOpen(false);
  };

  const selectedCount = selectedProjects.length;
  const totalCount = projects.length;

  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar proyectos
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar..." />
            <div className="p-2 border-b flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="flex-1 h-8"
              >
                Todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="flex-1 h-8"
              >
                Ninguno
              </Button>
            </div>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            
            {folders && folders.length > 0 && (
              <>
                <CommandGroup heading="Carpetas">
                  {folders.map((folder) => (
                    <CommandItem
                      key={folder.id}
                      value={folder.folder_name}
                      onSelect={() => handleSelectFolder(folder.project_ids)}
                      className="cursor-pointer"
                    >
                      <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="flex-1">{folder.folder_name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {folder.project_ids.length}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            
            <CommandGroup heading="Proyectos">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => handleToggleProject(project.id)}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={selectedProjects.includes(project.id)}
                    className="mr-2"
                  />
                  <span className="flex-1">{project.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="text-sm text-muted-foreground">
        {selectedCount === 0 ? (
          'Ningún proyecto'
        ) : selectedCount === totalCount ? (
          `Todos (${totalCount})`
        ) : (
          `${selectedCount} de ${totalCount}`
        )}
      </div>

      {selectedCount > 0 && selectedCount < totalCount && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-7 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
};
