"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, MessageSquare, Tag, Users, Bell, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/settings/ai-agents", label: "AI Agents", icon: Bot },
  { href: "/settings/channels", label: "Canais", icon: MessageSquare },
  { href: "/settings/tags", label: "Tags", icon: Tag },
  { href: "/settings/members", label: "Membros", icon: Users },
  { href: "/settings/notifications", label: "Notificações", icon: Bell },
  { href: "/settings/integrations/zoho", label: "Zoho CRM", icon: Plug },
];

function SettingsNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  const pathname = usePathname();
  const active = pathname?.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-smooth",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      {active && (
        <motion.span
          layoutId="settings-nav"
          className="absolute inset-0 rounded-md bg-accent"
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
        />
      )}
      <Icon className="relative z-10 h-4 w-4" />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Configurações</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie sua organização e integrações
          </p>
        </div>
      </div>
      <div className="flex h-full min-h-0">
        <nav className="w-56 shrink-0 border-r border-border bg-card p-3 flex flex-col gap-1">
          {items.map((item) => (
            <SettingsNavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
