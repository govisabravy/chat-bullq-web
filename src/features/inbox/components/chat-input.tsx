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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useQueryClient } from '@tanstack/react-query';
import { fileToBase64, formatBytes, MAX_MEDIA_BYTES } from '@/lib/file';
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

export function ChatInput({ conversationId, onSend, disabled, onMediaSent }: ChatInputProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; kind: MediaKind; previewUrl?: string } | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickKindRef = useRef<MediaKind>('IMAGE');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size === 0) return;
        if (blob.size > MAX_MEDIA_BYTES) {
          toast.error('Áudio muito longo (>16MB)');
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        try {
          setIsUploading(true);
          const base64 = await fileToBase64(blob);
          const msg = await inboxService.sendMedia({
            conversationId,
            type: 'AUDIO',
            mediaBase64: base64,
            mimeType: mime,
            fileName: `audio-${Date.now()}.${mime.includes('ogg') ? 'ogg' : 'webm'}`,
          });
          injectOptimistic(msg, blobUrl);
          onMediaSent?.();
        } catch (err) {
          URL.revokeObjectURL(blobUrl);
          toast.error(err instanceof Error ? err.message : 'Erro ao enviar áudio');
        } finally {
          setIsUploading(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Permita acesso ao microfone');
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (disabled) {
    return (
      <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50">
        Conversa encerrada — reabra para enviar mensagens
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Enviar {pendingFile.kind.toLowerCase()}
              </h3>
              <button
                onClick={cancelPending}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-3 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
              {pendingFile.kind === 'IMAGE' && pendingFile.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pendingFile.previewUrl}
                  alt="preview"
                  className="mx-auto max-h-56 rounded-md object-contain"
                />
              )}
              {pendingFile.kind === 'VIDEO' && pendingFile.previewUrl && (
                <video
                  src={pendingFile.previewUrl}
                  controls
                  preload="metadata"
                  className="mx-auto max-h-56 rounded-md"
                />
              )}
              {(pendingFile.kind === 'AUDIO' || pendingFile.kind === 'DOCUMENT') && (
                <div className="flex items-center gap-3">
                  {pendingFile.kind === 'AUDIO' ? <Music2 className="h-8 w-8 text-zinc-400" /> : <FileText className="h-8 w-8 text-zinc-400" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{pendingFile.file.name}</p>
                    <p className="text-xs text-zinc-500">{formatBytes(pendingFile.file.size)}</p>
                  </div>
                </div>
              )}
            </div>
            {(pendingFile.kind === 'IMAGE' || pendingFile.kind === 'VIDEO' || pendingFile.kind === 'DOCUMENT') && (
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Legenda (opcional)..."
                rows={2}
                className="mb-3 w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelPending}
                disabled={isUploading}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={sendPending}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-end gap-2">
          <Menu as="div" className="relative">
            <MenuButton className="mb-1 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
              <Paperclip className="h-5 w-5" />
            </MenuButton>
            <MenuItems
              anchor="top start"
              className="z-30 mb-1 w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg outline-none dark:border-zinc-700 dark:bg-zinc-900"
            >
              <MenuItem>
                <button
                  onClick={() => openPicker('IMAGE')}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ImageIcon className="h-4 w-4" /> Imagem
                </button>
              </MenuItem>
              <MenuItem>
                <button
                  onClick={() => openPicker('VIDEO')}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <VideoIcon className="h-4 w-4" /> Vídeo
                </button>
              </MenuItem>
              <MenuItem>
                <button
                  onClick={() => openPicker('AUDIO')}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Music2 className="h-4 w-4" /> Áudio (arquivo)
                </button>
              </MenuItem>
              <MenuItem>
                <button
                  onClick={() => openPicker('DOCUMENT')}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <FileText className="h-4 w-4" /> Documento
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={isRecording ? 'Gravando...' : 'Digite uma mensagem...'}
            rows={1}
            disabled={isRecording}
            className="max-h-40 min-h-[40px] flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />

          {text.trim() ? (
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || isSending}
              className="mb-1 rounded-lg bg-primary p-2.5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          ) : (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={() => isRecording && stopRecording()}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isUploading}
              className={`mb-1 rounded-lg p-2.5 transition-colors disabled:opacity-50 ${
                isRecording
                  ? 'animate-pulse bg-red-500 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
              title="Pressione e segure para gravar"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
