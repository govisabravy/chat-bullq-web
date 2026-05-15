'use client';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { MODELS } from '../constants';

export function ChatModelSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const active = MODELS.find((m) => m.id === value) ?? MODELS[0];

  const grouped = MODELS.reduce<Record<string, typeof MODELS>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs hover:bg-muted"
      >
        {active.name}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-10 mb-1 w-72 overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {Object.entries(grouped).map(([provider, list]) => (
            <div key={provider}>
              <div className="border-b border-border bg-muted/40 px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">{provider}</div>
              {list.map((m) => (
                <button
                  key={m.id} type="button"
                  onClick={() => { onChange(m.id); setOpen(false); }}
                  className={`flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-muted ${m.id === value ? 'bg-muted' : ''}`}
                >
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-muted-foreground">{m.description}</div>
                  </div>
                  {m.badge && <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">{m.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
