'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import {
  notificationsService,
  type NotificationPreference,
  type NotificationType,
} from '@/features/notifications/services/notifications.service';
import {
  getActiveSubscription,
  subscribeBrowser,
  unsubscribeBrowser,
} from '@/features/notifications/lib/push';

const ALL_TYPES: NotificationType[] = [
  'NEW_MESSAGE',
  'CONVERSATION_ASSIGNED',
  'CONVERSATION_TRANSFERRED',
  'SLA_WARNING',
  'SLA_BREACH',
  'MENTION',
  'SYSTEM',
];

const TYPE_LABELS: Record<NotificationType, string> = {
  NEW_MESSAGE: 'Nova mensagem',
  CONVERSATION_ASSIGNED: 'Conversa atribuída',
  CONVERSATION_TRANSFERRED: 'Conversa transferida',
  SLA_WARNING: 'Aviso SLA',
  SLA_BREACH: 'Quebra SLA',
  MENTION: 'Menção',
  SYSTEM: 'Sistema',
};

const DEFAULT_PREF: Omit<NotificationPreference, 'type'> = {
  inApp: true,
  browserPush: true,
  email: false,
  sound: true,
};

const PREFS_QUERY_KEY = ['notification-preferences'] as const;

type PrefField = 'inApp' | 'browserPush' | 'email' | 'sound';

function buildMap(list: NotificationPreference[] | undefined) {
  const map = {} as Record<NotificationType, NotificationPreference>;
  for (const t of ALL_TYPES) {
    map[t] = { type: t, ...DEFAULT_PREF };
  }
  if (list) {
    for (const p of list) {
      map[p.type] = p;
    }
  }
  return map;
}

function ToggleField({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label>{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function permissionToLabel(p: NotificationPermission | 'unsupported'): string {
  switch (p) {
    case 'granted':
      return 'Permitido';
    case 'denied':
      return 'Bloqueado pelo navegador';
    case 'default':
      return 'Ainda não solicitado';
    default:
      return 'Não suportado';
  }
}

function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function SettingsNotificationsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userEmail = user?.email ?? '...';

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: PREFS_QUERY_KEY,
    queryFn: () => notificationsService.getPreferences(),
  });

  const prefs = useMemo(() => buildMap(data), [data]);

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    'default',
  );
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
    let cancelled = false;
    getActiveSubscription().then((sub) => {
      if (!cancelled) setPushSubscribed(!!sub);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = async (
    type: NotificationType,
    field: PrefField,
    value: boolean,
  ) => {
    const previous = data;
    queryClient.setQueryData<NotificationPreference[]>(PREFS_QUERY_KEY, (old) => {
      const map = buildMap(old);
      map[type] = { ...map[type], [field]: value };
      return ALL_TYPES.map((t) => map[t]);
    });
    try {
      await notificationsService.updatePreference({ type, [field]: value });
    } catch (err) {
      queryClient.setQueryData(PREFS_QUERY_KEY, previous);
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar preferência');
      queryClient.invalidateQueries({ queryKey: PREFS_QUERY_KEY });
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const key = await notificationsService.getVapidPublicKey();
      if (!key) {
        toast.error('Push não configurado no servidor (VAPID).');
        return;
      }
      const sub = await subscribeBrowser(key);
      await notificationsService.subscribePush({ ...sub, userAgent: navigator.userAgent });
      setPushSubscribed(true);
      if ('Notification' in window) setPermission(Notification.permission);
      toast.success('Push ativado nesse dispositivo');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao ativar push');
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const endpoint = await unsubscribeBrowser();
      if (endpoint) await notificationsService.unsubscribePush(endpoint);
      setPushSubscribed(false);
      toast.success('Push desativado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await notificationsService.testEmail();
      toast.success('Email de teste enviado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar email teste');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      await notificationsService.testPush();
      toast.success('Push de teste enviado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar push teste');
    } finally {
      setTestingPush(false);
    }
  };

  const permissionLabel = permissionToLabel(permission);

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notificações</h1>
          <p className="text-sm text-muted-foreground">Controle alertas por canal.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Erro ao carregar</CardTitle>
            <CardDescription>
              Não foi possível buscar suas preferências de notificação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" loading={isRefetching} onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notificações</h1>
        <p className="text-sm text-muted-foreground">Controle alertas por canal.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>Enviado para {userEmail}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <SkeletonRows count={ALL_TYPES.length} />
          ) : (
            ALL_TYPES.map((type, idx) => (
              <div key={type} className="space-y-4">
                <ToggleField
                  label={TYPE_LABELS[type]}
                  checked={prefs[type].email}
                  onChange={(v) => updateField(type, 'email', v)}
                />
                {idx < ALL_TYPES.length - 1 ? <Separator /> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push</CardTitle>
          <CardDescription>Notificações no navegador.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-muted/30 p-3">
            <div>
              <Label>Permissão do navegador</Label>
              <p className="text-xs text-muted-foreground">{permissionLabel}</p>
            </div>
            {pushSubscribed ? (
              <Button variant="outline" size="sm" onClick={handleUnsubscribe}>
                Desativar
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                loading={subscribing}
                disabled={permission === 'unsupported' || permission === 'denied'}
                onClick={handleSubscribe}
              >
                Ativar push
              </Button>
            )}
          </div>

          {isLoading ? (
            <SkeletonRows count={ALL_TYPES.length} />
          ) : (
            ALL_TYPES.map((type, idx) => (
              <div key={type} className="space-y-4">
                <ToggleField
                  label={TYPE_LABELS[type]}
                  checked={prefs[type].browserPush}
                  onChange={(v) => updateField(type, 'browserPush', v)}
                  disabled={!pushSubscribed}
                />
                {idx < ALL_TYPES.length - 1 ? <Separator /> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testes</CardTitle>
          <CardDescription>Dispare uma notificação de teste para si mesmo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" loading={testingEmail} onClick={handleTestEmail}>
            Enviar email teste
          </Button>
          <Button variant="outline" size="sm" loading={testingPush} onClick={handleTestPush}>
            Enviar push teste
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
