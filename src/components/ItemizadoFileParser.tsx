import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet, Loader2, Check, X, Trash2, Edit2, Save } from 'lucide-react';
import { useParseItemizado, ParsedItem } from '@/hooks/useParseItemizado';

interface Props {
  onItemsAccepted: (items: ParsedItem[]) => void;
  title?: string;
  description?: string;
  allowEdit?: boolean;
}

const fmt = (n: number | null | undefined) =>
  n != null ? `$${n.toLocaleString('es-CL', { minimumFractionDigits: 0 })}` : '-';

const ItemizadoFileParser: React.FC<Props> = ({
  onItemsAccepted,
  title = 'Importar Itemizado',
  description = 'Sube un archivo Excel, PDF o Word con el itemizado y lo interpretaremos automáticamente.',
  allowEdit = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { parseFile, parsing, result, error, reset } = useParseItemizado();
  const [editingItems, setEditingItems] = useState<ParsedItem[] | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const processFile = async (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
    ];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['xlsx', 'xls', 'pdf', 'docx', 'csv'];

    if (!validTypes.includes(file.type) && !validExts.includes(ext || '')) return;
    if (file.size > 10 * 1024 * 1024) return;

    setFileName(file.name);
    const parsed = await parseFile(file);
    if (parsed) {
      setEditingItems([...parsed.items]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleAccept = () => {
    const items = editingItems || result?.items || [];
    if (items.length > 0) {
      onItemsAccepted(items);
      reset();
      setEditingItems(null);
      setFileName('');
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    reset();
    setEditingItems(null);
    setFileName('');
    setEditIdx(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const updateItem = (idx: number, field: keyof ParsedItem, value: string) => {
    if (!editingItems) return;
    const updated = [...editingItems];
    const item = { ...updated[idx] };
    if (field === 'descripcion' || field === 'unidad') {
      (item as any)[field] = value || null;
    } else if (field === 'cantidad' || field === 'precio_unitario' || field === 'precio_total') {
      const num = parseFloat(value);
      (item as any)[field] = isNaN(num) ? null : num;
    }
    // Auto-calculate total
    if (field === 'cantidad' || field === 'precio_unitario') {
      if (item.cantidad != null && item.precio_unitario != null) {
        item.precio_total = Math.round(item.cantidad * item.precio_unitario);
      }
    }
    updated[idx] = item;
    setEditingItems(updated);
  };

  const deleteItem = (idx: number) => {
    if (!editingItems) return;
    setEditingItems(editingItems.filter((_, i) => i !== idx).map((it, i) => ({ ...it, orden: i + 1 })));
    setEditIdx(null);
  };

  const displayItems = editingItems || result?.items || [];
  const subtotal = displayItems.reduce((s, i) => s + (i.precio_total || 0), 0);

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        {!result && !parsing && (
          <div
            className="flex items-center gap-3 w-full cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Upload className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.pdf,.docx,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Loading state */}
        {parsing && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Analizando <strong>{fileName}</strong>...
            </p>
            <p className="text-xs text-muted-foreground">
              Extrayendo partidas, unidades, cantidades y precios
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !parsing && (
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Intentar de nuevo
            </Button>
          </div>
        )}

        {/* Results preview */}
        {displayItems.length > 0 && !parsing && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{displayItems.length} partidas</Badge>
                <span className="text-xs text-muted-foreground">de {fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleAccept}>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Aceptar Itemizado
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center w-20">Unidad</TableHead>
                    <TableHead className="text-right w-24">Cantidad</TableHead>
                    <TableHead className="text-right w-28">P. Unitario</TableHead>
                    <TableHead className="text-right w-28">Total</TableHead>
                    {allowEdit && <TableHead className="w-16" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      {editIdx === idx ? (
                        <>
                          <TableCell>
                            <Input
                              value={item.descripcion}
                              onChange={(e) => updateItem(idx, 'descripcion', e.target.value)}
                              className="h-7 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.unidad || ''}
                              onChange={(e) => updateItem(idx, 'unidad', e.target.value)}
                              className="h-7 text-xs text-center w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.cantidad ?? ''}
                              onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                              className="h-7 text-xs text-right w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.precio_unitario ?? ''}
                              onChange={(e) => updateItem(idx, 'precio_unitario', e.target.value)}
                              className="h-7 text-xs text-right w-24"
                            />
                          </TableCell>
                          <TableCell className="text-right text-xs font-medium">
                            {fmt(item.precio_total)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditIdx(null)}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteItem(idx)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-xs font-medium">{item.descripcion}</TableCell>
                          <TableCell className="text-center text-xs">{item.unidad || '-'}</TableCell>
                          <TableCell className="text-right text-xs">{item.cantidad ?? '-'}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(item.precio_unitario)}</TableCell>
                          <TableCell className="text-right text-xs font-medium">{fmt(item.precio_total)}</TableCell>
                          {allowEdit && (
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditIdx(idx)}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          )}
                        </>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell colSpan={allowEdit ? 5 : 5} className="text-right font-bold text-xs">
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs">{fmt(subtotal)}</TableCell>
                    {allowEdit && <TableCell />}
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {result?.metadata && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {result.metadata.moneda && (
                  <Badge variant="outline">Moneda: {result.metadata.moneda}</Badge>
                )}
                {result.metadata.gastos_generales_pct != null && (
                  <Badge variant="outline">GG: {result.metadata.gastos_generales_pct}%</Badge>
                )}
                {result.metadata.utilidades_pct != null && (
                  <Badge variant="outline">Util: {result.metadata.utilidades_pct}%</Badge>
                )}
                {result.metadata.iva_pct != null && (
                  <Badge variant="outline">IVA: {result.metadata.iva_pct}%</Badge>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ItemizadoFileParser;
