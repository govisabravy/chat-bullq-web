"use client";

import {
  CloseButton,
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

interface SidebarLayoutProps {
  sidebar: ReactNode;
  navbar?: ReactNode;
  children: ReactNode;
}

export function SidebarLayout({
  sidebar,
  navbar,
  children,
}: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative isolate flex min-h-svh w-full bg-white max-lg:flex-col lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950">
      {/* Mobile sidebar overlay */}
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/30 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200"
        />
        <DialogPanel
          transition
          className="fixed inset-y-0 left-0 w-full max-w-80 p-2 transition duration-300 ease-in-out data-[closed]:-translate-x-full"
        >
          <div className="flex h-full flex-col rounded-lg bg-white shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
            <div className="-mb-3 px-4 pt-3">
              <CloseButton
                as="button"
                aria-label="Fechar menu"
                className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
              >
                <X className="size-5" />
              </CloseButton>
            </div>
            {sidebar}
          </div>
        </DialogPanel>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 max-lg:hidden">
        <div className="flex h-full flex-col border-r border-zinc-950/5 bg-white dark:border-white/5 dark:bg-zinc-900">
          {sidebar}
        </div>
      </div>

      {/* Content area */}
      <main className="flex flex-1 flex-col lg:min-w-0 lg:pl-64">
        {/* Mobile header */}
        <div className="flex items-center gap-4 border-b border-zinc-950/5 px-4 py-2.5 dark:border-white/5 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">{navbar}</div>
        </div>

        {/* Page content */}
        <div className="flex flex-1 flex-col min-h-0 lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
          {children}
        </div>
      </main>
    </div>
  );
}
