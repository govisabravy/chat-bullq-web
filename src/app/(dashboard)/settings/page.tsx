'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, Users, Tags, Bell, Building2 } from 'lucide-react';

const tabs = [
  { href: '/settings', label: 'Geral', icon: Building2 },
  { href: '/settings/channels', label: 'Canais', icon: Radio },
  { href: '/settings/members', label: 'Membros', icon: Users },
  { href: '/settings/tags', label: 'Tags', icon: Tags },
  { href: '/settings/notifications', label: 'Notificações', icon: Bell },
];

export default function SettingsPage() {
  const pathname = usePathname();

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Configurações
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Gerencie sua organização e integrações
      </p>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <Building2 className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Configurações gerais da organização — disponível em breve
          </p>
        </div>
      </div>
    </div>
  );
}
