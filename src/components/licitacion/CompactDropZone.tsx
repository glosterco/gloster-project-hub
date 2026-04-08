import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  disabled?: boolean;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

const CompactDropZone: React.FC<CompactDropZoneProps> = ({
  onFilesSelected,
  accept,
  multiple = false,
  maxSizeMB = 10,
  disabled = false,
  selectedFiles = [],
  onRemoveFile,
  placeholder = 'Arrastra archivos aquí o haz click',
  className,
  compact = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  const processFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.size <= maxSizeMB * 1024 * 1024);
    if (arr.length > 0) {
      onFilesSelected(multiple ? arr : [arr[0]]);
    }
  }, [maxSizeMB, multiple, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'border border-dashed rounded-md cursor-pointer transition-colors flex items-center gap-2',
          compact ? 'px-3 py-2' : 'px-4 py-3',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <Upload className={cn('shrink-0 text-muted-foreground', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        <span className={cn('text-muted-foreground truncate', compact ? 'text-xs' : 'text-sm')}>
          {dragActive ? 'Suelta aquí' : placeholder}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedFiles.map((file, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[11px] max-w-[200px]"
            >
              <Paperclip className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{file.name}</span>
              {onRemoveFile && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveFile(idx); }}
                  className="shrink-0 hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompactDropZone;
