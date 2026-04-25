"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/motion";

export default function Landing() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.62 0.2 290 / 0.18), transparent 70%)",
        }}
      />

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 text-center"
      >
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          WhatsApp · AI Agents · Omnichannel
        </span>
        <h1 className="text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
          Atendimento que escala sem perder a voz humana.
        </h1>
        <p className="max-w-lg text-base text-muted-foreground md:text-lg">
          BullQ combina agentes de IA com handoff pra humano numa plataforma só.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/register">
            <Button variant="primary" size="lg">Começar grátis</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">Entrar</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
