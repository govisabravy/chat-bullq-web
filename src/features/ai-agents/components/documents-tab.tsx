'use client';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCw, RotateCw, Upload } from 'lucide-react';
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
    if (!files) return;
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
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-white p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
      >
        <Upload className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
        <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Clique ou arraste arquivos
        </p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          PDF, DOCX, TXT, XLSX, áudio, vídeo, imagens · máx 50MB por arquivo
        </p>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading && <Loader2 className="mt-3 h-5 w-5 animate-spin text-primary" />}
      </div>

      <div className="space-y-2">
        {docs.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Nenhum documento. Faça upload pra alimentar o RAG do agente.
          </p>
        ) : (
          docs.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/70"
            >
              <StatusIcon status={d.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{d.fileName}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {(d.sizeBytes / 1024).toFixed(1)} KB · {d.mimeType} ·{' '}
                  <span className="tabular-nums">{d.totalChunks}</span> chunks
                  {d.errorReason && (
                    <span className="ml-1 text-red-500 dark:text-red-400" title={d.errorReason}>
                      · erro
                    </span>
                  )}
                </p>
              </div>
              {d.status === 'FAILED' && (
                <button
                  onClick={() => retry(d.id)}
                  className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  title="Reprocessar"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              {d.status === 'READY' && (
                <button
                  onClick={() => setReingestTarget(d.id)}
                  className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  title="Reingerir (aplica contextual chunks)"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setDeleteTarget({ id: d.id, fileName: d.fileName })}
                className="rounded-md p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                title="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={reingestTarget !== null} onOpenChange={(v) => !v && setReingestTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reingerir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Apaga os chunks atuais e reprocessa do zero (gera novo sumário contextual). Útil para aplicar melhorias de RAG em documentos já indexados.
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
                  O arquivo <span className="font-medium text-zinc-900 dark:text-zinc-100">{deleteTarget.fileName}</span> será apagado do storage e todos os chunks indexados serão removidos da memória do agente. Essa ação não pode ser desfeita.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusIcon({ status }: { status: AiDocument['status'] }) {
  if (status === 'READY')
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 dark:text-emerald-400" />;
  if (status === 'FAILED')
    return <AlertCircle className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />;
  return <Loader2 className="h-5 w-5 shrink-0 animate-spin text-zinc-400 dark:text-zinc-500" />;
}
