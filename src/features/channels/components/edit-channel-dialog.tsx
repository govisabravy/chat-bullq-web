'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Loader2,
  X,
  Copy,
  Check,
  Zap,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  channelsService,
  type Channel,
  type TestConnectionResult,
} from '../services/channels.service';

const ZAPPFY_API_URL = 'https://api.zappfy.io';
const ZAPPFY_FAVICON = 'https://www.google.com/s2/favicons?domain=zappfy.io&sz=64';

const zappfySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  url: z.string().url('URL inválida'),
  token: z.string().min(1, 'Token é obrigatório'),
  webhookSecret: z.string().optional(),
});

const waOfficialSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phoneNumberId: z.string().min(1, 'Phone Number ID é obrigatório'),
  accessToken: z.string().min(1, 'Access Token é obrigatório'),
  businessAccountId: z.string().optional(),
  webhookSecret: z.string().optional(),
});

const instagramSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  pageId: z.string().min(1, 'Page ID é obrigatório'),
  pageAccessToken: z.string().min(1, 'Page Access Token é obrigatório'),
  igUserId: z.string().optional(),
  webhookSecret: z.string().optional(),
});

type ZappfyFormData = z.infer<typeof zappfySchema>;
type WaOfficialFormData = z.infer<typeof waOfficialSchema>;
type InstagramFormData = z.infer<typeof instagramSchema>;

const inputCls =
  'flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';
const labelCls = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
const errorCls = 'text-xs text-red-500';

interface EditChannelDialogProps {
  channel: Channel | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditChannelDialog({ channel, open, onClose, onSaved }: EditChannelDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  const zappfyForm = useForm<ZappfyFormData>({
    resolver: zodResolver(zappfySchema),
    defaultValues: { name: '', url: ZAPPFY_API_URL, token: '', webhookSecret: '' },
  });

  const waForm = useForm<WaOfficialFormData>({
    resolver: zodResolver(waOfficialSchema),
    defaultValues: { name: '', phoneNumberId: '', accessToken: '', businessAccountId: '', webhookSecret: '' },
  });

  const igForm = useForm<InstagramFormData>({
    resolver: zodResolver(instagramSchema),
    defaultValues: { name: '', pageId: '', pageAccessToken: '', igUserId: '', webhookSecret: '' },
  });

  useEffect(() => {
    if (!channel) return;
    setTestResult(null);
    if (channel.type === 'WHATSAPP_ZAPPFY') {
      zappfyForm.reset({
        name: channel.name,
        url: channel.config?.url || ZAPPFY_API_URL,
        token: channel.config?.token || '',
        webhookSecret: channel.webhookSecret || '',
      });
    } else if (channel.type === 'WHATSAPP_OFFICIAL') {
      waForm.reset({
        name: channel.name,
        phoneNumberId: channel.config?.phoneNumberId || '',
        accessToken: channel.config?.accessToken || '',
        businessAccountId: channel.config?.businessAccountId || '',
        webhookSecret: channel.webhookSecret || '',
      });
    } else if (channel.type === 'INSTAGRAM') {
      igForm.reset({
        name: channel.name,
        pageId: channel.config?.pageId || '',
        pageAccessToken: channel.config?.pageAccessToken || '',
        igUserId: channel.config?.igUserId || '',
        webhookSecret: channel.webhookSecret || '',
      });
    }
  }, [channel, zappfyForm, waForm, igForm]);

  const apiBaseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin.replace(':3000', ':3001')}/api/v1`
      : 'http://localhost:3001/api/v1';

  const webhookSuffix = channel?.webhookToken ? `/${channel.webhookToken}` : '';
  const buildWebhookUrl = (channelType: string) =>
    `${apiBaseUrl}/webhooks/${channelType}${webhookSuffix}`;

  const handleCopyWebhook = (channelType: string) => {
    navigator.clipboard.writeText(buildWebhookUrl(channelType));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setTestResult(null);
    setIsTesting(false);
    onClose();
  };

  const saveChannel = async (
    name: string,
    config: Record<string, any>,
    webhookSecret?: string,
  ) => {
    if (!channel) return;
    setIsLoading(true);
    try {
      await channelsService.update(channel.id, { name, config, webhookSecret });
      toast.success('Canal atualizado');
      handleClose();
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar canal');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitZappfy = (data: ZappfyFormData) =>
    saveChannel(data.name, { url: data.url, token: data.token }, data.webhookSecret);

  const onSubmitWaOfficial = (data: WaOfficialFormData) =>
    saveChannel(
      data.name,
      {
        phoneNumberId: data.phoneNumberId,
        accessToken: data.accessToken,
        businessAccountId: data.businessAccountId,
      },
      data.webhookSecret,
    );

  const onSubmitInstagram = (data: InstagramFormData) =>
    saveChannel(
      data.name,
      {
        pageId: data.pageId,
        pageAccessToken: data.pageAccessToken,
        igUserId: data.igUserId,
      },
      data.webhookSecret,
    );

  const handleTestZappfy = async () => {
    const valid = await zappfyForm.trigger(['url', 'token']);
    if (!valid) return;
    const { url, token } = zappfyForm.getValues();
    setIsTesting(true);
    try {
      const result = await channelsService.testConfig('WHATSAPP_ZAPPFY', { url, token });
      setTestResult(result);
      if (result.success) {
        toast.success(`Conexão OK — ${result.data?.profileName || result.status || 'conectado'}`);
      } else {
        toast.error(result.error || 'Falha na conexão');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao testar conexão';
      setTestResult({ success: false, error });
      toast.error(error);
    } finally {
      setIsTesting(false);
    }
  };

  if (!open || !channel) return null;

  const titleMap: Record<string, string> = {
    WHATSAPP_ZAPPFY: 'Editar canal Zappfy',
    WHATSAPP_OFFICIAL: 'Editar canal WhatsApp Official',
    INSTAGRAM: 'Editar canal Instagram',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {channel.type === 'WHATSAPP_ZAPPFY' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ZAPPFY_FAVICON} alt="Zappfy" className="h-5 w-5" />
            )}
            {titleMap[channel.type]}
          </h2>
          <button onClick={handleClose} className="rounded-md p-1 text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {channel.type === 'WHATSAPP_ZAPPFY' ? (
          <form onSubmit={zappfyForm.handleSubmit(onSubmitZappfy)} className="mt-6 space-y-4">
            <Field
              label="Nome do canal"
              placeholder="Ex: WhatsApp Principal"
              error={zappfyForm.formState.errors.name?.message}
              {...zappfyForm.register('name')}
            />
            <Field
              label="URL"
              readOnly
              value={ZAPPFY_API_URL}
              error={zappfyForm.formState.errors.url?.message}
              {...zappfyForm.register('url')}
            />
            <Field
              label="Token"
              type="password"
              placeholder="••••••••"
              error={zappfyForm.formState.errors.token?.message}
              {...zappfyForm.register('token')}
            />
            <Field
              label="Webhook Secret"
              placeholder="Opcional"
              optional
              {...zappfyForm.register('webhookSecret')}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestZappfy}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Testar Conexão
              </button>
              {testResult?.success && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> Conectado
                </span>
              )}
              {testResult && !testResult.success && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" /> Falhou
                </span>
              )}
            </div>
            <WebhookUrl
              url={buildWebhookUrl('WHATSAPP_ZAPPFY')}
              copied={copied}
              onCopy={() => handleCopyWebhook('WHATSAPP_ZAPPFY')}
            />
            <FormFooter isLoading={isLoading} onCancel={handleClose} />
          </form>
        ) : channel.type === 'WHATSAPP_OFFICIAL' ? (
          <form onSubmit={waForm.handleSubmit(onSubmitWaOfficial)} className="mt-6 space-y-4">
            <Field label="Nome do canal" error={waForm.formState.errors.name?.message} {...waForm.register('name')} />
            <Field label="Phone Number ID" error={waForm.formState.errors.phoneNumberId?.message} {...waForm.register('phoneNumberId')} />
            <Field label="Access Token" type="password" error={waForm.formState.errors.accessToken?.message} {...waForm.register('accessToken')} />
            <Field label="Business Account ID" optional {...waForm.register('businessAccountId')} />
            <Field label="Webhook Verify Token" optional {...waForm.register('webhookSecret')} />
            <WebhookUrl
              url={buildWebhookUrl('WHATSAPP_OFFICIAL')}
              copied={copied}
              onCopy={() => handleCopyWebhook('WHATSAPP_OFFICIAL')}
            />
            <FormFooter isLoading={isLoading} onCancel={handleClose} />
          </form>
        ) : channel.type === 'INSTAGRAM' ? (
          <form onSubmit={igForm.handleSubmit(onSubmitInstagram)} className="mt-6 space-y-4">
            <Field label="Nome do canal" error={igForm.formState.errors.name?.message} {...igForm.register('name')} />
            <Field label="Page ID" error={igForm.formState.errors.pageId?.message} {...igForm.register('pageId')} />
            <Field label="Page Access Token" type="password" error={igForm.formState.errors.pageAccessToken?.message} {...igForm.register('pageAccessToken')} />
            <Field label="Instagram User ID" optional {...igForm.register('igUserId')} />
            <Field label="Webhook Verify Token" optional {...igForm.register('webhookSecret')} />
            <WebhookUrl
              url={buildWebhookUrl('INSTAGRAM')}
              copied={copied}
              onCopy={() => handleCopyWebhook('INSTAGRAM')}
            />
            <FormFooter isLoading={isLoading} onCancel={handleClose} />
          </form>
        ) : null}
      </div>
    </div>
  );
}

import { forwardRef } from 'react';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  optional?: boolean;
}

const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, optional, ...props }, ref) => (
    <div className="space-y-1.5">
      <label className={labelCls}>
        {label} {optional && <span className="text-zinc-400">(opcional)</span>}
      </label>
      <input ref={ref} className={inputCls} {...props} />
      {error && <p className={errorCls}>{error}</p>}
    </div>
  ),
);
Field.displayName = 'Field';

function WebhookUrl({ url, copied, onCopy }: { url: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        URL do Webhook (cole no painel do provedor):
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {url}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function FormFooter({ isLoading, onCancel }: { isLoading: boolean; onCancel: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar
      </button>
    </div>
  );
}
