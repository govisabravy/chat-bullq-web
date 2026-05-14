"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
} from "@/components/ui/dropdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fadeInUp } from "@/lib/motion";
import { aiAgentsService } from "../services/ai-agents.service";

export interface AgentListCardProps {
  id: string;
  name: string;
  description?: string | null;
  provider: string;
  model: string;
  isActive: boolean;
  updatedAt: string;
}

export function AgentListCard(props: AgentListCardProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const duplicate = useMutation({
    mutationFn: () => aiAgentsService.duplicate(props.id),
    onSuccess: (created) => {
      toast.success("Agente duplicado");
      qc.invalidateQueries({ queryKey: ["ai-agents"] });
      router.push(`/settings/ai-agents/${created.id}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao duplicar");
    },
  });

  const destroy = useMutation({
    mutationFn: () => aiAgentsService.destroy(props.id),
    onSuccess: (res) => {
      toast.success(
        res.removedFiles > 0
          ? `Agente excluído · ${res.removedFiles} arquivo(s) RAG removido(s)`
          : "Agente excluído",
      );
      qc.invalidateQueries({ queryKey: ["ai-agents"] });
      setConfirmOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    },
  });

  const canConfirm = confirmText.trim().toUpperCase() === "EXCLUIR";

  return (
    <>
      <motion.div variants={fadeInUp} layout>
        <Card className="cursor-pointer hover:shadow-soft hover:border-primary/30">
          <Link href={`/settings/ai-agents/${props.id}`} className="block">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="truncate">{props.name}</CardTitle>
                <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                  <Badge variant={props.isActive ? "success" : "default"}>
                    {props.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <Dropdown>
                    <DropdownButton
                      className="rounded-md p-1 hover:bg-muted"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      {duplicate.isPending || destroy.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </DropdownButton>
                    <DropdownMenu anchor="bottom end" className="min-w-48">
                      <DropdownItem onClick={() => duplicate.mutate()}>
                        <Copy className="h-4 w-4" />
                        <DropdownLabel>Duplicar agente</DropdownLabel>
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => {
                          setConfirmText("");
                          setConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <DropdownLabel>
                          <span className="text-destructive">Excluir agente</span>
                        </DropdownLabel>
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {props.description || `${props.provider} · ${props.model}`}
              </CardDescription>
            </CardHeader>
            <CardFooter className="text-xs text-muted-foreground">
              Atualizado: {new Date(props.updatedAt).toLocaleDateString("pt-BR")}
            </CardFooter>
          </Link>
        </Card>
      </motion.div>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agente {props.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  Vai apagar <strong>permanentemente</strong>:
                </p>
                <ul className="list-inside list-disc text-xs">
                  <li>Configurações do agente (prompt, keys, modelo)</li>
                  <li>Todos os documentos RAG e chunks/embeddings (arquivos exclusivos do MinIO)</li>
                  <li>Vínculos com canais</li>
                  <li>Logs de interação e métricas diárias</li>
                  <li>Vínculos de handoff</li>
                </ul>
                <p className="text-amber-700 dark:text-amber-300">
                  Conversas que estavam usando esse agente continuam, mas sem agente ativo.
                </p>
                <p>
                  Digite <code className="rounded bg-muted px-1 font-mono text-xs">EXCLUIR</code> para confirmar:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  autoFocus
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!canConfirm || destroy.isPending}
              onClick={() => canConfirm && destroy.mutate()}
            >
              {destroy.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
