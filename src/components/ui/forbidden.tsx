'use client';

import Link from 'next/link';
import { ShieldOff } from 'lucide-react';

export interface ForbiddenProps {
  title?: string;
  description?: string;
  href?: string;
  cta?: string;
}

export function Forbidden({
  title = 'Sem acesso',
  description = 'Você não tem permissão para acessar essa área. Fale com um administrador da organização.',
  href = '/inbox',
  cta = 'Voltar pro inbox',
}: ForbiddenProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <ShieldOff className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {cta}
      </Link>
    </div>
  );
}
