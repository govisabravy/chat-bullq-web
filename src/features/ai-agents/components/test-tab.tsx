'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Sparkles } from 'lucide-react';
import { aiAgentsService } from '../services/ai-agents.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatBubble } from '@/features/inbox/components/chat-bubble';

interface TestTurn {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: boolean;
}

function nowLabel() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function TestTab({ agentId }: { agentId: string }) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TestTurn[]>([]);

  const testMutation = useMutation({
    mutationFn: (message: string) => aiAgentsService.test(agentId, message),
    onSuccess: (r) => {
      setHistory((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'agent',
          text: r.reply,
          timestamp: nowLabel(),
          latencyMs: r.latencyMs,
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
        },
      ]);
    },
    onError: (err: unknown) => {
      setHistory((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'agent',
          text: err instanceof Error ? err.message : String(err),
          timestamp: nowLabel(),
          error: true,
        },
      ]);
    },
  });

  const sending = testMutation.isPending;

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setHistory((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: trimmed, timestamp: nowLabel() },
    ]);
    setInput('');
    testMutation.mutate(trimmed);
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>Sandbox de teste</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Playground stateless: nao usa RAG nem historico, so testa o system prompt e credenciais.
            Para testar com documentos, envie mensagem real no WhatsApp.
          </p>
        </div>

        <div className="flex min-h-[240px] flex-col gap-3 rounded-md border border-border bg-card p-3">
          {history.length === 0 ? (
            <p className="my-auto text-center text-xs text-muted-foreground">
              Nenhuma mensagem enviada ainda
            </p>
          ) : (
            history.map((turn) => (
              <div key={turn.id} className="flex flex-col gap-1">
                <ChatBubble
                  direction={turn.role === 'user' ? 'inbound' : 'outbound'}
                  timestamp={turn.timestamp}
                >
                  {turn.text}
                </ChatBubble>
                {turn.role === 'agent' && !turn.error && turn.latencyMs !== undefined ? (
                  <div className="flex flex-wrap justify-end gap-1.5 pr-1">
                    <Badge variant="outline" className="tabular-nums">
                      {turn.latencyMs}ms
                    </Badge>
                    <Badge variant="outline" className="tabular-nums">
                      in {turn.inputTokens}
                    </Badge>
                    <Badge variant="outline" className="tabular-nums">
                      out {turn.outputTokens}
                    </Badge>
                  </div>
                ) : null}
                {turn.role === 'agent' && turn.error ? (
                  <div className="flex justify-end pr-1">
                    <Badge variant="error">erro</Badge>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </CardContent>

      <div className="border-t border-border bg-card p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Escreva uma mensagem de teste... (Ctrl/Cmd+Enter envia)"
            className="flex-1"
          />
          <Button
            variant="primary"
            size="icon"
            loading={sending}
            disabled={sending || !input.trim()}
            onClick={send}
            aria-label="Enviar"
          >
            {!sending && <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
