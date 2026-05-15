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
        className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-white/70 hover:bg-white/[0.06] hover:text-white/90 transition-colors"
      >
        {active.name}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-1 w-72 overflow-hidden rounded-md border border-white/[0.08] bg-black/90 backdrop-blur-xl shadow-2xl">
          {Object.entries(grouped).map(([provider, list]) => (
            <div key={provider}>
              <div className="border-b border-white/[0.05] bg-white/[0.02] px-2 py-1 text-[10px] uppercase tracking-wider text-white/40">{provider}</div>
              {list.map((m) => (
                <button
                  key={m.id} type="button"
                  onClick={() => { onChange(m.id); setOpen(false); }}
                  className={`flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${
                    m.id === value ? 'bg-white/[0.08] text-white' : 'text-white/70 hover:bg-white/[0.05] hover:text-white/90'
                  }`}
                >
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-white/40">{m.description}</div>
                  </div>
                  {m.badge && <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/60">{m.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
