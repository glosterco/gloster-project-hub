import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

  const handleRemoveProject = (projectId: number) => {
    onProjectsChange(selectedProjects.filter(id => id !== projectId));
  };

  const selectedProjectNames = projects
    .filter(p => selectedProjects.includes(p.id))
    .map(p => p.name);

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtrar por Proyectos</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={selectedProjects.length === projects.length}
          >
            Seleccionar todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={selectedProjects.length === 0}
          >
            Limpiar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-4 w-4 mr-2" />
              Buscar proyectos
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar proyecto..." />
              <CommandEmpty>No se encontraron proyectos.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => {
                      handleToggleProject(project.id);
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{project.name}</span>
                      {selectedProjects.includes(project.id) && (
                        <Badge variant="default" className="ml-2">
                          ✓
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedProjectNames.map((name, index) => {
          const project = projects.find(p => p.name === name);
          if (!project) return null;
          
          return (
            <Badge
              key={project.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              {name}
              <button
                onClick={() => handleRemoveProject(project.id)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        {selectedProjects.length === 0
          ? 'Ningún proyecto seleccionado'
          : selectedProjects.length === projects.length
          ? `Todos los proyectos seleccionados (${projects.length})`
          : `${selectedProjects.length} de ${projects.length} proyectos seleccionados`}
      </div>
    </Card>
  );
};
