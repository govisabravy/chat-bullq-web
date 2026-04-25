'use client';
import { Fragment, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  File as FileIcon,
  Loader2,
  RefreshCw,
  RotateCw,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { aiAgentsService, type AiDocument } from '../services/ai-agents.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';

export function DocumentsTab({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [reingestTarget, setReingestTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; fileName: string } | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ['ai-docs', agentId],
    queryFn: () => aiAgentsService.listDocuments(agentId),
    refetchInterval: (query) => {
      const list = (query.state.data as AiDocument[] | undefined) ?? [];
      return list.some((d) => d.status === 'PENDING' || d.status === 'PROCESSING') ? 3000 : false;
    },
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await aiAgentsService.uploadDocument(agentId, file);
      }
      toast.success('Upload enfileirado');
      queryClient.invalidateQueries({ queryKey: ['ai-docs', agentId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      await aiAgentsService.deleteDocument(agentId, id);
      toast.success('Documento removido');
      queryClient.invalidateQueries({ queryKey: ['ai-docs', agentId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    } finally {
      setDeleteTarget(null);
    }
  };

  const retry = async (id: string) => {
    await aiAgentsService.retryDocument(agentId, id);
    queryClient.invalidateQueries({ queryKey: ['ai-docs', agentId] });
  };

  const confirmReingest = async () => {
    if (!reingestTarget) return;
    const id = reingestTarget;
    try {
      await aiAgentsService.reingestDocument(agentId, id);
      toast.success('Reingestão enfileirada');
      queryClient.invalidateQueries({ queryKey: ['ai-docs', agentId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao reingerir');
    } finally {
      setReingestTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-smooth hover:bg-accent/40 hover:border-primary/50"
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Arraste arquivos aqui ou clique</p>
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, TXT, XLSX, áudio, vídeo (max 50MB)
        </p>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading && <Loader2 className="mt-2 h-5 w-5 animate-spin text-primary" />}
      </div>

      <div className="rounded-lg border border-border bg-card">
        {docs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum documento. Faça upload pra alimentar o RAG do agente.
          </p>
        ) : (
          docs.map((d, idx) => {
            const Icon = iconForMime(d.mimeType, d.fileName);
            return (
              <Fragment key={d.id}>
                {idx > 0 && <Separator />}
                <div className="flex items-center gap-3 p-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{d.fileName}</p>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {(d.sizeBytes / 1024).toFixed(1)} KB · {d.mimeType} ·{' '}
                      <span className="tabular-nums">{d.totalChunks}</span> chunks
                      {d.errorReason && (
                        <span className="ml-1 text-destructive" title={d.errorReason}>
                          · erro
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {d.status === 'FAILED' && (
                      <Tooltip content="Reprocessar">
                        <Button variant="ghost" size="icon" onClick={() => retry(d.id)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    )}
                    {d.status === 'READY' && (
                      <Tooltip content="Reingerir (aplica contextual chunks)">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setReingestTarget(d.id)}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip content="Remover">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget({ id: d.id, fileName: d.fileName })}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </Fragment>
            );
          })
        )}
      </div>

      <AlertDialog
        open={reingestTarget !== null}
        onOpenChange={(v) => !v && setReingestTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reingerir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Apaga os chunks atuais e reprocessa do zero (gera novo sumário contextual). Útil para
              aplicar melhorias de RAG em documentos já indexados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReingest}>Reingerir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  O arquivo{' '}
                  <span className="font-medium text-foreground">{deleteTarget.fileName}</span> será
                  apagado do storage e todos os chunks indexados serão removidos da memória do
                  agente. Essa ação não pode ser desfeita.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: AiDocument['status'] }) {
  if (status === 'READY') {
    return (
      <Badge variant="success">
        <CheckCircle2 className="h-3 w-3" />
        Pronto
      </Badge>
    );
  }
  if (status === 'FAILED') {
    return (
      <Badge variant="error">
        <AlertCircle className="h-3 w-3" />
        Falhou
      </Badge>
    );
  }
  return (
    <Badge variant="warning">
      <Loader2 className="h-3 w-3 animate-spin" />
      {status === 'PROCESSING' ? 'Processando' : 'Pendente'}
    </Badge>
  );
}

function iconForMime(mime: string, fileName: string): LucideIcon {
  const m = (mime || '').toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (m.startsWith('image/')) return FileImage;
  if (m.startsWith('audio/')) return FileAudio;
  if (m.startsWith('video/')) return FileVideo;
  if (m.includes('pdf') || ext === 'pdf') return FileText;
  if (
    m.includes('spreadsheet') ||
    m.includes('excel') ||
    m.includes('csv') ||
    ext === 'xlsx' ||
    ext === 'xls' ||
    ext === 'csv'
  )
    return FileSpreadsheet;
  if (m.includes('word') || m.includes('document') || ext === 'docx' || ext === 'doc')
    return FileText;
  if (m.includes('text') || ext === 'txt' || ext === 'md') return FileText;
  if (m.includes('zip') || m.includes('compressed') || ext === 'zip' || ext === 'rar')
    return FileArchive;
  return FileIcon;
}
