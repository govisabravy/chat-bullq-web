'use client';
import { useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { aiAgentsService } from '../services/ai-agents.service';

export function TestTab({ agentId }: { agentId: string }) {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState<{
    text: string;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    error?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setReply(null);
    try {
      const r = await aiAgentsService.test(agentId, input);
      setReply({
        text: r.reply,
        latencyMs: r.latencyMs,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
      });
    } catch (err) {
      setReply({
        text: err instanceof Error ? err.message : String(err),
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-zinc-700 dark:border-primary/30 dark:bg-primary/10 dark:text-zinc-200">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Playground stateless: não usa RAG nem histórico, só testa o system prompt e credenciais.
          Para testar com documentos, envie mensagem real no WhatsApp.
        </p>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
        }}
        rows={3}
        placeholder="Escreva uma mensagem de teste... (Ctrl/Cmd+Enter envia)"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      <button
        onClick={send}
        disabled={loading || !input.trim()}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Enviar
      </button>

      {reply && (
        <div
          className={`rounded-lg border p-4 ${
            reply.error
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200'
              : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-100">
            {reply.text}
          </p>
          {!reply.error && (
            <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="tabular-nums">{reply.latencyMs}ms</span> · in{' '}
              <span className="tabular-nums">{reply.inputTokens}</span> tokens · out{' '}
              <span className="tabular-nums">{reply.outputTokens}</span> tokens
            </p>
          )}
        </div>
      )}
    </div>
  );
}
