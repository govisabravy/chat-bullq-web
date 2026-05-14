"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Loader2, MoreVertical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
} from "@/components/ui/dropdown";
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

  return (
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
                    {duplicate.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </DropdownButton>
                  <DropdownMenu anchor="bottom end" className="min-w-44">
                    <DropdownItem
                      onClick={() => {
                        duplicate.mutate();
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      <DropdownLabel>Duplicar agente</DropdownLabel>
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
  );
}
