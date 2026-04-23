'use client';
import {
  createContext,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';
import { cn } from '@/lib/utils';

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const AlertDialogCtx = createContext<Ctx | null>(null);

function useCtx() {
  const ctx = useContext(AlertDialogCtx);
  if (!ctx) throw new Error('AlertDialog components must be used inside <AlertDialog>');
  return ctx;
}

export function AlertDialog({
  children,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
}: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  defaultOpen?: boolean;
}) {
  const [internal, setInternal] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internal;
  const setOpen = (v: boolean) => {
    if (!controlled) setInternal(v);
    onOpenChange?.(v);
  };
  return <AlertDialogCtx.Provider value={{ open, setOpen }}>{children}</AlertDialogCtx.Provider>;
}

export function AlertDialogTrigger({
  children,
  asChild: _asChild,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { setOpen } = useCtx();
  return (
    <button type="button" onClick={() => setOpen(true)} {...rest}>
      {children}
    </button>
  );
}

export function AlertDialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { open, setOpen } = useCtx();
  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150 data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className={cn(
            'w-full max-w-md transform rounded-xl border border-zinc-200 bg-white p-6 shadow-xl transition-all duration-150 data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-zinc-800 dark:bg-zinc-950',
            className,
          )}
        >
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export function AlertDialogHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-2', className)} {...rest} />;
}

export function AlertDialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row', className)}
      {...rest}
    />
  );
}

export function AlertDialogTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <DialogTitle
      as="h2"
      className={cn('text-base font-semibold text-zinc-900 dark:text-zinc-100', className)}
    >
      {children}
    </DialogTitle>
  );
}

export function AlertDialogDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn('text-sm text-zinc-600 dark:text-zinc-400', className)}>{children}</p>
  );
}

export function AlertDialogAction({
  className,
  onClick,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useCtx();
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({
  className,
  onClick,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useCtx();
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
