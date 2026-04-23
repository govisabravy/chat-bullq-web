'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, Users, Tags, Bell, Building2, Bot } from 'lucide-react';

const tabs = [
  { href: '/settings', label: 'Geral', icon: Building2 },
  { href: '/settings/channels', label: 'Canais', icon: Radio },
  { href: '/settings/ai-agents', label: 'Agentes IA', icon: Bot },
  { href: '/settings/members', label: 'Membros', icon: Users },
  { href: '/settings/tags', label: 'Tags', icon: Tags },
  { href: '/settings/notifications', label: 'Notificações', icon: Bell },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-zinc-200 bg-white px-6 pt-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Configurações</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie sua organização e integrações
          </p>
          <nav className="mt-6 flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive =
                tab.href === '/settings'
                  ? pathname === '/settings'
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto w-full max-w-5xl p-6">{children}</div>
      </div>
    </div>
  );
}
