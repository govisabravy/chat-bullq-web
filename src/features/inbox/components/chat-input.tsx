'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Video as VideoIcon,
  Music2,
  FileText,
  X,
  Check,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { fileToBase64, formatBytes, MAX_MEDIA_BYTES } from '@/lib/file';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tooltip } from '@/components/ui/tooltip';
import { slideDown } from '@/lib/motion';
import { inboxService, type Message, type SendMediaPayload } from '../services/inbox.service';

interface ChatInputProps {
  conversationId: string;
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  onMediaSent?: () => void;
}

type MediaKind = SendMediaPayload['type'];

const ACCEPT_BY_KIND: Record<MediaKind, string> = {
  IMAGE: 'image/*',
  VIDEO: 'video/*',
  AUDIO: 'audio/*',
  DOCUMENT:
    '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,application/*',
};

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function ChatInput({ conversationId, onSend, disabled, onMediaSent }: ChatInputProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; kind: MediaKind; previewUrl?: string } | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(() => Array(28).fill(0));
  const [recordedAudio, setRecordedAudio] = useState<
    | { blob: Blob; blobUrl: string; mime: string; durationMs: number }
    | null
  >(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickKindRef = useRef<MediaKind>('IMAGE');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordCancelRef = useRef(false);
  const recordStartRef = useRef<number>(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const injectOptimistic = useCallback((msg: Message, blobUrl: string) => {
    queryClient.setQueryData(['messages', conversationId], (old: any) => {
      if (!old) return old;
      const exists = old.messages?.some((m: Message) => m.id === msg.id);
      if (exists) return old;
      const optimistic: Message = {
        ...msg,
        content: { ...msg.content, mediaUrl: blobUrl },
      };
      return { ...old, messages: [...(old.messages || []), optimistic] };
    });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [conversationId, queryClient]);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      await onSend(trimmed);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } finally {
      setIsSending(false);
    }
  }, [text, isSending, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const openPicker = (kind: MediaKind) => {
    pickKindRef.current = kind;
    if (fileInputRef.current) {
      fileInputRef.current.accept = ACCEPT_BY_KIND[kind];
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MEDIA_BYTES) {
      toast.error(`Arquivo excede 16MB (${formatBytes(file.size)})`);
      return;
    }
    const kind = pickKindRef.current;
    const previewUrl = kind === 'IMAGE' || kind === 'VIDEO' ? URL.createObjectURL(file) : undefined;
    setPendingFile({ file, kind, previewUrl });
    setCaption('');
  };

  const cancelPending = useCallback(() => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
    setCaption('');
  }, [pendingFile]);

  const sendPending = useCallback(async () => {
    if (!pendingFile || isUploading) return;
    setIsUploading(true);
    const blobUrl = URL.createObjectURL(pendingFile.file);
    try {
      const base64 = await fileToBase64(pendingFile.file);
      const msg = await inboxService.sendMedia({
        conversationId,
        type: pendingFile.kind,
        mediaBase64: base64,
        mimeType: pendingFile.file.type || 'application/octet-stream',
        fileName: pendingFile.file.name,
        caption: caption.trim() || undefined,
      });
      injectOptimistic(msg, blobUrl);
      cancelPending();
      onMediaSent?.();
    } catch (err) {
      URL.revokeObjectURL(blobUrl);
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar mídia');
    } finally {
      setIsUploading(false);
    }
  }, [pendingFile, caption, conversationId, isUploading, cancelPending, onMediaSent, injectOptimistic]);

  const clearRecordTimer = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const stopAnalyser = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevels(Array(28).fill(0));
  };

  const startAnalyser = (stream: MediaStream) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const barCount = 28;

      const tick = () => {
        const a = analyserRef.current;
        if (!a) return;
        a.getByteFrequencyData(data);
        const binSize = Math.max(1, Math.floor(data.length / barCount));
        const bars: number[] = [];
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < binSize; j++) {
            sum += data[i * binSize + j] ?? 0;
          }
          const avg = sum / binSize / 255;
          bars.push(Math.min(1, avg * 2.4));
        }
        setAudioLevels(bars);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {}
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recordCancelRef.current = false;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearRecordTimer();
        stopAnalyser();
        const durationMs = Date.now() - recordStartRef.current;
        if (recordCancelRef.current) {
          chunksRef.current = [];
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size === 0) return;
        if (blob.size > MAX_MEDIA_BYTES) {
          toast.error('Áudio muito longo (>16MB)');
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        setRecordedAudio({ blob, blobUrl, mime, durationMs });
      };
      recorderRef.current = recorder;
      recorder.start();
      recordStartRef.current = Date.now();
      setRecordElapsed(0);
      recordTimerRef.current = setInterval(() => {
        setRecordElapsed(Date.now() - recordStartRef.current);
      }, 100);
      startAnalyser(stream);
      setIsRecording(true);
    } catch (err) {
      toast.error('Permita acesso ao microfone');
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    recordCancelRef.current = false;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    const recorder = recorderRef.current;
    recordCancelRef.current = true;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    clearRecordTimer();
    stopAnalyser();
    setIsRecording(false);
    setRecordElapsed(0);
  };

  const discardRecordedAudio = () => {
    if (recordedAudio) URL.revokeObjectURL(recordedAudio.blobUrl);
    setRecordedAudio(null);
  };

  const sendRecordedAudio = async () => {
    if (!recordedAudio || isUploading) return;
    setIsUploading(true);
    try {
      const base64 = await fileToBase64(recordedAudio.blob);
      const msg = await inboxService.sendMedia({
        conversationId,
        type: 'AUDIO',
        mediaBase64: base64,
        mimeType: recordedAudio.mime,
        fileName: `audio-${Date.now()}.${recordedAudio.mime.includes('ogg') ? 'ogg' : 'webm'}`,
      });
      injectOptimistic(msg, recordedAudio.blobUrl);
      setRecordedAudio(null);
      onMediaSent?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar áudio');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
      if (recordedAudio) URL.revokeObjectURL(recordedAudio.blobUrl);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      clearRecordTimer();
      stopAnalyser();
    };
  }, []);

  if (disabled) {
    return (
      <div className="border-t border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
        Conversa encerrada — reabra para enviar mensagens
      </div>
    );
  }

  const hasText = text.trim().length > 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={!!pendingFile} onOpenChange={(v) => !v && cancelPending()}>
        <DialogContent size="lg">
          {pendingFile && (
            <>
              <DialogHeader>
                <DialogTitle>Enviar {pendingFile.kind.toLowerCase()}</DialogTitle>
                <DialogDescription>
                  {pendingFile.file.name} — {formatBytes(pendingFile.file.size)}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
                {pendingFile.kind === 'IMAGE' && pendingFile.previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pendingFile.previewUrl}
                    alt="preview"
                    className="mx-auto max-h-64 rounded-md object-contain"
                  />
                )}
                {pendingFile.kind === 'VIDEO' && pendingFile.previewUrl && (
                  <video
                    src={pendingFile.previewUrl}
                    controls
                    preload="metadata"
                    className="mx-auto max-h-64 rounded-md"
                  />
                )}
                {(pendingFile.kind === 'AUDIO' || pendingFile.kind === 'DOCUMENT') && (
                  <div className="flex items-center gap-3">
                    {pendingFile.kind === 'AUDIO' ? (
                      <Music2 className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{pendingFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(pendingFile.file.size)}</p>
                    </div>
                  </div>
                )}
              </div>

              {(pendingFile.kind === 'IMAGE' || pendingFile.kind === 'VIDEO' || pendingFile.kind === 'DOCUMENT') && (
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Legenda (opcional)..."
                  rows={2}
                  className="mt-3 min-h-[64px]"
                />
              )}

              <DialogFooter>
                <Button variant="outline" onClick={cancelPending} disabled={isUploading}>
                  Cancelar
                </Button>
                <Button variant="primary" loading={isUploading} onClick={sendPending}>
                  Enviar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="border-t border-border bg-card p-3">
        <AnimatePresence mode="wait" initial={false}>
          {recordedAudio ? (
            <motion.div
              key="preview"
              variants={slideDown}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex items-center gap-3"
            >
              <Tooltip content="Descartar">
                <Button variant="ghost" size="icon" onClick={discardRecordedAudio} disabled={isUploading}>
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </Tooltip>
              <audio
                src={recordedAudio.blobUrl}
                controls
                className="h-9 flex-1 min-w-0"
              />
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {formatElapsed(recordedAudio.durationMs)}
              </span>
              <Tooltip content="Enviar áudio">
                <Button variant="primary" size="icon" onClick={sendRecordedAudio} loading={isUploading}>
                  {!isUploading && <Send className="h-5 w-5" />}
                </Button>
              </Tooltip>
            </motion.div>
          ) : isRecording ? (
            <motion.div
              key="recording"
              variants={slideDown}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex items-center gap-3"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse shrink-0" />
              <span className="text-sm font-mono text-foreground tabular-nums shrink-0">
                {formatElapsed(recordElapsed)}
              </span>
              <div className="flex h-9 flex-1 items-center gap-[3px] px-2">
                {audioLevels.map((level, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-full bg-primary"
                    style={{
                      height: `${Math.max(10, level * 100)}%`,
                      opacity: 0.35 + level * 0.65,
                      transition: 'height 80ms linear, opacity 80ms linear',
                    }}
                  />
                ))}
              </div>
              <Tooltip content="Cancelar">
                <Button variant="ghost" size="icon" onClick={cancelRecording}>
                  <X className="h-5 w-5" />
                </Button>
              </Tooltip>
              <Tooltip content="Parar e revisar">
                <Button variant="primary" size="icon" onClick={stopRecording}>
                  <Check className="h-5 w-5" />
                </Button>
              </Tooltip>
            </motion.div>
          ) : (
            <motion.div
              key="toolbar"
              variants={slideDown}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex items-end gap-2"
            >
              <Menu as="div" className="relative">
                <Tooltip content="Anexar arquivo">
                  <MenuButton
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-focus data-[open]:bg-accent data-[open]:text-accent-foreground"
                    aria-label="Anexar arquivo"
                  >
                    <Paperclip className="h-5 w-5" />
                  </MenuButton>
                </Tooltip>
                <MenuItems
                  anchor="top start"
                  className="z-30 mb-1 w-48 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-soft outline-none transition-smooth"
                >
                  <MenuItem>
                    <button
                      onClick={() => openPicker('IMAGE')}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground transition-smooth data-[focus]:bg-accent data-[focus]:text-accent-foreground"
                    >
                      <ImageIcon className="h-4 w-4" /> Imagem
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={() => openPicker('VIDEO')}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground transition-smooth data-[focus]:bg-accent data-[focus]:text-accent-foreground"
                    >
                      <VideoIcon className="h-4 w-4" /> Vídeo
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={() => openPicker('AUDIO')}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground transition-smooth data-[focus]:bg-accent data-[focus]:text-accent-foreground"
                    >
                      <Music2 className="h-4 w-4" /> Áudio (arquivo)
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={() => openPicker('DOCUMENT')}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground transition-smooth data-[focus]:bg-accent data-[focus]:text-accent-foreground"
                    >
                      <FileText className="h-4 w-4" /> Documento
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>

              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder="Digite uma mensagem..."
                rows={1}
                className="max-h-40 min-h-[40px] flex-1 px-4 py-2"
              />

              {hasText ? (
                <Tooltip content="Enviar">
                  <Button
                    variant="primary"
                    size="icon"
                    onClick={handleSubmit}
                    disabled={!hasText || isSending}
                    loading={isSending}
                  >
                    {!isSending && <Send className="h-5 w-5" />}
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip content="Gravar áudio">
                  <Button
                    variant="primary"
                    size="icon"
                    onClick={startRecording}
                    disabled={isUploading}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </Tooltip>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
