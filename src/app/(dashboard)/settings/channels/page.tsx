'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Instagram, MessageSquare, Plus, Settings, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { fadeInUp, listStagger } from '@/lib/motion';
import {
  channelsService,
  type Channel,
  type ChannelType,
} from '@/features/channels/services/channels.service';
import { CreateChannelDialog } from '@/features/channels/components/create-channel-dialog';
import { EditChannelDialog } from '@/features/channels/components/edit-channel-dialog';

const typeLabels: Record<ChannelType, string> = {
  WHATSAPP_OFFICIAL: 'WhatsApp Official',
  WHATSAPP_ZAPPFY: 'WhatsApp (Zappfy)',
  INSTAGRAM: 'Instagram',
};

function IconFor({ type }: { type: ChannelType }) {
  if (type === 'INSTAGRAM') return <Instagram className="h-4 w-4" />;
  if (type === 'WHATSAPP_OFFICIAL') return <Smartphone className="h-4 w-4" />;
  if (type === 'WHATSAPP_ZAPPFY') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="https://www.google.com/s2/favicons?domain=zappfy.io&sz=64"
        alt="Zappfy"
        className="h-4 w-4"
      />
    );
  }
  return <MessageSquare className="h-4 w-4" />;
}

export default function SettingsChannelsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Channel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null);

  const { data: channels, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsService.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['channels'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => channelsService.remove(id),
    onSuccess: () => {
      toast.success('Canal removido');
      refresh();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover canal');
    },
    onSettled: () => setDeleteTarget(null),
  });

  const openSettings = (c: Channel) => {
    setEditTarget(c);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Canais</h1>
          <p className="text-sm text-muted-foreground">Gerencie integrações de mensageria.</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Novo canal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : channels && channels.length > 0 ? (
        <motion.div
          variants={listStagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {channels.map((c) => (
            <motion.div key={c.id} variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <IconFor type={c.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate">{c.name}</CardTitle>
                      <CardDescription>{typeLabels[c.type]}</CardDescription>
                    </div>
                    <Badge variant={c.isActive ? 'success' : 'default'}>
                      {c.isActive ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardFooter className="justify-between">
                  <div className="text-xs text-muted-foreground">
                    Criado {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex gap-1">
                    <Tooltip content="Configurar">
                      <Button variant="ghost" size="icon" onClick={() => openSettings(c)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Remover">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum canal configurado</CardTitle>
            <CardDescription>
              Conecte seu primeiro canal para começar a receber mensagens.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Novo canal
            </Button>
          </CardFooter>
        </Card>
      )}

      <CreateChannelDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refresh}
      />

      <EditChannelDialog
        channel={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onSaved={refresh}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover canal</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {deleteTarget?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
