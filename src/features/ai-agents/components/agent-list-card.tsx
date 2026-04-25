"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fadeInUp } from "@/lib/motion";

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
  return (
    <motion.div variants={fadeInUp} layout>
      <Link href={`/settings/ai-agents/${props.id}`} className="block">
        <Card className="cursor-pointer hover:shadow-soft hover:border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="truncate">{props.name}</CardTitle>
              <Badge variant={props.isActive ? "success" : "default"}>
                {props.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {props.description || `${props.provider} · ${props.model}`}
            </CardDescription>
          </CardHeader>
          <CardFooter className="text-xs text-muted-foreground">
            Atualizado: {new Date(props.updatedAt).toLocaleDateString("pt-BR")}
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
