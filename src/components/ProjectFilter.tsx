import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Filter, Folder, ChevronRight, ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useMandanteFolders } from '@/hooks/useMandanteFolders';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());
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

  const { folders = [] } = useMandanteFolders(mandanteId);

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
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const selectedCount = selectedProjects.length;
  const totalCount = projects.length;

  // Filter projects based on search query
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter folders based on search query
  const filteredFolders = folders.filter(f =>
    f.folder_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFolderProjectsSelected = (projectIds: number[]) => {
    return projectIds.every(id => selectedProjects.includes(id));
  };

  const someFolderProjectsSelected = (projectIds: number[]) => {
    return projectIds.some(id => selectedProjects.includes(id)) && 
           !allFolderProjectsSelected(projectIds);
  };

  const selectedProjectNames = projects
    .filter(p => selectedProjects.includes(p.id))
    .map(p => p.name);

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative h-9 pl-3 pr-10">
              <Filter className="h-4 w-4 mr-2" />
              Proyectos
              {selectedCount > 0 && selectedCount < totalCount && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 min-w-5 px-1.5 text-xs font-medium"
                >
                  {selectedCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
        
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-lg">Filtrar Proyectos</SheetTitle>
            <SheetDescription>
              Selecciona los proyectos para visualizar sus métricas
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proyectos o carpetas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-3 border-b flex items-center justify-between bg-muted/30">
            <div className="text-sm text-muted-foreground">
              {selectedCount === totalCount ? (
                <span className="font-medium text-foreground">Todos seleccionados</span>
              ) : selectedCount === 0 ? (
                <span>Ninguno seleccionado</span>
              ) : (
                <span><span className="font-medium text-foreground">{selectedCount}</span> de {totalCount}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedCount === totalCount}
                className="h-7 text-xs"
              >
                Todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedCount === 0}
                className="h-7 text-xs"
              >
                Ninguno
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="px-6 py-4 space-y-4">
              {/* Folders Section */}
              {filteredFolders.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Carpetas
                  </div>
                  {filteredFolders.map((folder) => {
                    const isExpanded = expandedFolders.has(folder.id);
                    const allSelected = allFolderProjectsSelected(folder.project_ids);
                    const someSelected = someFolderProjectsSelected(folder.project_ids);
                    const folderProjects = projects.filter(p => folder.project_ids.includes(p.id));

                    return (
                      <div key={folder.id} className="space-y-1">
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <button
                            onClick={() => toggleFolder(folder.id)}
                            className="flex items-center flex-1 gap-2"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Folder className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium flex-1 text-left">
                              {folder.folder_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {folder.project_ids.length}
                            </Badge>
                          </button>
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => {
                              if (allSelected) {
                                // Deselect all projects in folder
                                onProjectsChange(
                                  selectedProjects.filter(id => !folder.project_ids.includes(id))
                                );
                              } else {
                                // Select all projects in folder
                                handleSelectFolder(folder.project_ids);
                              }
                            }}
                          />
                        </div>
                        
                        {isExpanded && (
                          <div className="ml-10 space-y-1">
                            {folderProjects.map((project) => (
                              <div
                                key={project.id}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => handleToggleProject(project.id)}
                              >
                                <Checkbox
                                  checked={selectedProjects.includes(project.id)}
                                  onCheckedChange={() => handleToggleProject(project.id)}
                                />
                                <span className="text-sm flex-1">{project.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Projects Section */}
              {filteredProjects.length > 0 && (
                <>
                  {filteredFolders.length > 0 && <Separator className="my-4" />}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Proyectos
                    </div>
                    {filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer",
                          selectedProjects.includes(project.id) 
                            ? "bg-primary/5 hover:bg-primary/10" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => handleToggleProject(project.id)}
                      >
                        <Checkbox
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={() => handleToggleProject(project.id)}
                        />
                        <span className="text-sm flex-1">{project.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {filteredProjects.length === 0 && filteredFolders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No se encontraron proyectos o carpetas
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

        <div className="text-sm text-muted-foreground">
          {selectedCount === 0 ? (
            'Ningún proyecto seleccionado'
          ) : selectedCount === totalCount ? (
            <span className="text-foreground font-medium">Todos los proyectos ({totalCount})</span>
          ) : (
            <span><span className="text-foreground font-medium">{selectedCount}</span> de {totalCount} proyectos</span>
          )}
        </div>
      </div>

      {/* Selected Projects Display */}
      {selectedCount > 0 && selectedCount < totalCount && (
        <div className="flex flex-wrap gap-2">
          {selectedProjectNames.map((name) => (
            <Badge 
              key={name}
              variant="secondary"
              className="px-3 py-1 text-xs"
            >
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
