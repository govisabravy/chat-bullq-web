'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Search, Shield, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { membersService, type Member } from '@/features/settings/services/members.service';
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
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
} from '@/components/ui/dropdown';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const roleLabels: Record<Member['role'], string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Admin',
  AGENT: 'Agente',
};

const roleVariant = (role: Member['role']): 'info' | 'success' | 'default' =>
  role === 'OWNER' ? 'info' : role === 'ADMIN' ? 'success' : 'default';

const nextRole = (role: Member['role']): Member['role'] =>
  role === 'ADMIN' ? 'AGENT' : 'ADMIN';

export default function SettingsMembersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'AGENT'>('AGENT');
  const [inviting, setInviting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => membersService.list(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['members'] });

  const members = useMemo(() => {
    const source = data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return source;
    return source.filter(
      (m) =>
        m.user.name.toLowerCase().includes(term) ||
        m.user.email.toLowerCase().includes(term),
    );
  }, [data, q]);

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    try {
      await membersService.invite({ email, role: inviteRole });
      toast.success('Membro convidado!');
      setInviteEmail('');
      setInviteRole('AGENT');
      setInviteOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao convidar');
    } finally {
      setInviting(false);
    }
  };

  const promoteRole = async (m: Member) => {
    if (m.role === 'OWNER') {
      toast.error('Não é possível alterar a role do proprietário');
      return;
    }
    const target = nextRole(m.role);
    try {
      await membersService.updateRole(m.id, target);
      toast.success('Role atualizada');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar role');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await membersService.remove(deleteTarget.id);
      toast.success('Membro removido');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Membros</h1>
          <p className="text-sm text-muted-foreground">Quem tem acesso à organização.</p>
        </div>
        <Button variant="primary" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Convidar
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Input
          iconLeft={<Search className="h-4 w-4" />}
          placeholder="Buscar por nome ou email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="sticky top-0 z-10 grid grid-cols-[1fr_1fr_100px_60px] gap-3 border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Nome</span>
          <span>Email</span>
          <span>Role</span>
          <span></span>
        </div>

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_100px_60px] items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16" />
              <div className="flex justify-end">
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))
        ) : members.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {q.trim() ? 'Nenhum membro encontrado.' : 'Nenhum membro ainda.'}
          </div>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_1fr_100px_60px] items-center gap-3 border-b border-border/50 px-4 py-3 text-sm transition-smooth last:border-b-0 hover:bg-accent/40"
            >
              <div className="flex items-center gap-3">
                <Avatar src={m.user.avatarUrl} alt={m.user.name} size="sm" />
                <span className="truncate font-medium text-foreground">{m.user.name}</span>
              </div>
              <span className="truncate text-muted-foreground">{m.user.email}</span>
              <Badge variant={roleVariant(m.role)}>{roleLabels[m.role]}</Badge>
              <div className="flex justify-end">
                <Dropdown>
                  <DropdownButton className="rounded-md p-2 text-muted-foreground transition-smooth hover:bg-accent hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownButton>
                  <DropdownMenu anchor="bottom end">
                    <DropdownItem onClick={() => promoteRole(m)}>
                      <Shield className="h-4 w-4" />
                      Alterar role
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem
                      onClick={() => setDeleteTarget(m)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convidar membro</AlertDialogTitle>
            <AlertDialogDescription>
              O convite será enviado por email com instruções de acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Separator className="my-4" />
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={inviteRole === 'AGENT' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setInviteRole('AGENT')}
              >
                Agente
              </Button>
              <Button
                type="button"
                variant={inviteRole === 'ADMIN' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setInviteRole('ADMIN')}
              >
                Admin
              </Button>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleInvite();
              }}
              disabled={!inviteEmail.trim() || inviting}
            >
              <UserPlus className="h-4 w-4" />
              Convidar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  <span className="font-medium text-foreground">
                    {deleteTarget.user.name}
                  </span>{' '}
                  perderá acesso à organização. Essa ação não pode ser desfeita.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
