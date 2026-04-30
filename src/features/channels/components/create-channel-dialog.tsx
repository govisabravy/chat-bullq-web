'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, X, MessageSquare, Smartphone, Instagram, Copy, Check, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { channelsService, type ChannelType, type TestConnectionResult } from '../services/channels.service';

const ZAPPFY_API_URL = 'https://api.zappfy.io';
const ZAPPFY_FAVICON = 'https://www.google.com/s2/favicons?domain=zappfy.io&sz=64';

const channelTypes: { value: ChannelType; label: string; icon?: React.ElementType; iconUrl?: string; color: string; description: string }[] = [
  {
    value: 'WHATSAPP_ZAPPFY',
    label: 'WhatsApp (Zappfy)',
    iconUrl: ZAPPFY_FAVICON,
    color: 'bg-green-500',
    description: 'Conecte via Zappfy/Uazapi — sem restrição de 24h',
  },
];

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

const inputCls = 'flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';
const labelCls = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
const errorCls = 'text-xs text-red-500';

interface CreateChannelDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateChannelDialog({ open, onClose, onCreated }: CreateChannelDialogProps) {
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  const zappfyForm = useForm<ZappfyFormData>({
    resolver: zodResolver(zappfySchema),
    defaultValues: { name: '', url: ZAPPFY_API_URL, token: '', webhookSecret: '' },
  });

  const zappfyUrl = zappfyForm.watch('url');
  const zappfyToken = zappfyForm.watch('token');

  useEffect(() => {
    setTestResult(null);
  }, [zappfyUrl, zappfyToken]);

  const waForm = useForm<WaOfficialFormData>({
    resolver: zodResolver(waOfficialSchema),
    defaultValues: { name: '', phoneNumberId: '', accessToken: '', businessAccountId: '', webhookSecret: '' },
  });

  const igForm = useForm<InstagramFormData>({
    resolver: zodResolver(instagramSchema),
    defaultValues: { name: '', pageId: '', pageAccessToken: '', igUserId: '', webhookSecret: '' },
  });

  const apiBaseUrl = typeof window !== 'undefined'
    ? `${window.location.origin.replace(':3000', ':3001')}/api/v1`
    : 'http://localhost:3001/api/v1';

  const handleTypeSelect = (type: ChannelType) => {
    setSelectedType(type);
    setStep('config');
  };

  const handleCopyWebhook = (channelType: string) => {
    navigator.clipboard.writeText(`${apiBaseUrl}/webhooks/${channelType}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitChannel = async (type: ChannelType, name: string, config: Record<string, any>, webhookSecret?: string) => {
    setIsLoading(true);
    try {
      await channelsService.create({ type, name, config, webhookSecret });
      toast.success('Canal criado com sucesso!');
      handleClose();
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar canal');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitZappfy = async (data: ZappfyFormData) => {
    if (!testResult?.success) {
      toast.error('Teste a conexão antes de criar o canal');
      return;
    }
    await submitChannel('WHATSAPP_ZAPPFY', data.name, { url: data.url, token: data.token }, data.webhookSecret);
  };

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

  const onSubmitWaOfficial = (data: WaOfficialFormData) =>
    submitChannel('WHATSAPP_OFFICIAL', data.name, { phoneNumberId: data.phoneNumberId, accessToken: data.accessToken, businessAccountId: data.businessAccountId }, data.webhookSecret);

  const onSubmitInstagram = (data: InstagramFormData) =>
    submitChannel('INSTAGRAM', data.name, { pageId: data.pageId, pageAccessToken: data.pageAccessToken, igUserId: data.igUserId }, data.webhookSecret);

  const handleClose = () => {
    setStep('type');
    setSelectedType(null);
    setTestResult(null);
    setIsTesting(false);
    zappfyForm.reset();
    waForm.reset();
    igForm.reset();
    onClose();
  };

  if (!open) return null;

  const titleMap: Record<string, string> = {
    WHATSAPP_ZAPPFY: 'Configurar Zappfy',
    WHATSAPP_OFFICIAL: 'Configurar WhatsApp Official',
    INSTAGRAM: 'Configurar Instagram',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {step === 'config' && selectedType === 'WHATSAPP_ZAPPFY' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ZAPPFY_FAVICON} alt="Zappfy" className="h-5 w-5" />
            )}
            {step === 'type' ? 'Novo Canal' : titleMap[selectedType || '']}
          </h2>
          <button onClick={handleClose} className="rounded-md p-1 text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'type' ? (
          <div className="mt-6 grid gap-3">
            {channelTypes.map((ct) => (
              <button
                key={ct.value}
                onClick={() => handleTypeSelect(ct.value)}
                className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4 text-left transition-all hover:border-primary hover:shadow-sm dark:border-zinc-700 dark:hover:border-primary"
              >
                {ct.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ct.iconUrl} alt={ct.label} className="h-10 w-10" />
                ) : ct.icon ? (
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${ct.color}`}>
                    <ct.icon className="h-5 w-5 text-white" />
                  </div>
                ) : null}
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{ct.label}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{ct.description}</p>
                </div>
              </button>
            ))}
          </div>
        ) : selectedType === 'WHATSAPP_ZAPPFY' ? (
          <form onSubmit={zappfyForm.handleSubmit(onSubmitZappfy)} className="mt-6 space-y-4">
            <Field label="Nome do canal" placeholder="Ex: WhatsApp Principal" error={zappfyForm.formState.errors.name?.message} {...zappfyForm.register('name')} />
            <Field
              label="URL"
              readOnly
              value={ZAPPFY_API_URL}
              error={zappfyForm.formState.errors.url?.message}
              {...zappfyForm.register('url')}
            />
            <Field label="Token" type="password" placeholder="••••••••" error={zappfyForm.formState.errors.token?.message} {...zappfyForm.register('token')} />
            <Field label="Webhook Secret" placeholder="Opcional" optional {...zappfyForm.register('webhookSecret')} />
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
            <ZappfyTestResult result={testResult} />
            <WebhookHint />
            <FormFooter
              isLoading={isLoading}
              onBack={() => setStep('type')}
              submitDisabled={!testResult?.success}
              submitLabel={testResult?.success ? 'Criar Canal' : 'Teste a conexão primeiro'}
            />
          </form>
        ) : selectedType === 'WHATSAPP_OFFICIAL' ? (
          <form onSubmit={waForm.handleSubmit(onSubmitWaOfficial)} className="mt-6 space-y-4">
            <Field label="Nome do canal" placeholder="Ex: WhatsApp Business" error={waForm.formState.errors.name?.message} {...waForm.register('name')} />
            <Field label="Phone Number ID" placeholder="Encontrado no Meta Business Suite" error={waForm.formState.errors.phoneNumberId?.message} {...waForm.register('phoneNumberId')} />
            <Field label="Access Token" type="password" placeholder="System User Token ou Temporary Token" error={waForm.formState.errors.accessToken?.message} {...waForm.register('accessToken')} />
            <Field label="Business Account ID" placeholder="Opcional" optional {...waForm.register('businessAccountId')} />
            <Field label="Webhook Verify Token" placeholder="Token que você definiu no Meta" optional {...waForm.register('webhookSecret')} />
            <WebhookHint />
            <FormFooter isLoading={isLoading} onBack={() => setStep('type')} />
          </form>
        ) : selectedType === 'INSTAGRAM' ? (
          <form onSubmit={igForm.handleSubmit(onSubmitInstagram)} className="mt-6 space-y-4">
            <Field label="Nome do canal" placeholder="Ex: Instagram Loja" error={igForm.formState.errors.name?.message} {...igForm.register('name')} />
            <Field label="Page ID" placeholder="ID da Facebook Page vinculada" error={igForm.formState.errors.pageId?.message} {...igForm.register('pageId')} />
            <Field label="Page Access Token" type="password" placeholder="Token de longa duração" error={igForm.formState.errors.pageAccessToken?.message} {...igForm.register('pageAccessToken')} />
            <Field label="Instagram User ID" placeholder="Opcional — detectado automaticamente" optional {...igForm.register('igUserId')} />
            <Field label="Webhook Verify Token" placeholder="Token que você definiu no Meta" optional {...igForm.register('webhookSecret')} />
            <WebhookHint />
            <FormFooter isLoading={isLoading} onBack={() => setStep('type')} />
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

function WebhookHint() {
  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 dark:border-amber-700/40 dark:bg-amber-900/10">
      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
        URL única do webhook gerada após salvar o canal — copie pelo card do canal e cole no painel do provedor.
      </p>
    </div>
  );
}

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

function FormFooter({
  isLoading,
  onBack,
  submitDisabled,
  submitLabel = 'Criar Canal',
}: {
  isLoading: boolean;
  onBack: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onBack}
        className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Voltar
      </button>
      <button
        type="submit"
        disabled={isLoading || submitDisabled}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}

function ZappfyTestResult({ result }: { result: TestConnectionResult | null }) {
  if (!result) return null;

  if (result.success) {
    const d = result.data || {};
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs dark:border-green-900/50 dark:bg-green-900/20">
        <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" /> Instância conectada
        </div>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-zinc-600 dark:text-zinc-300">
          {d.profileName && (<><dt className="font-medium">Perfil:</dt><dd>{d.profileName}</dd></>)}
          {d.name && (<><dt className="font-medium">Instância:</dt><dd>{d.name}</dd></>)}
          {d.owner && (<><dt className="font-medium">Número:</dt><dd>{d.owner}</dd></>)}
          {typeof d.isBusiness === 'boolean' && (<><dt className="font-medium">Business:</dt><dd>{d.isBusiness ? 'Sim' : 'Não'}</dd></>)}
          {result.status && (<><dt className="font-medium">Status:</dt><dd>{result.status}</dd></>)}
        </dl>
      </div>
    );
  }

  const qr = result.data?.qrcode;
  const pairCode = result.data?.pairCode;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs dark:border-red-900/50 dark:bg-red-900/20">
      <div className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
        <AlertCircle className="h-4 w-4" /> {result.error || 'Falha na conexão'}
      </div>
      {(qr || pairCode) && (
        <div className="mt-3 space-y-2 text-zinc-700 dark:text-zinc-200">
          {qr && (
            <div>
              <p className="font-medium">Escaneie o QR code no WhatsApp:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR code Zappfy" className="mt-1 h-40 w-40 rounded border bg-white p-1" />
            </div>
          )}
          {pairCode && (
            <div>
              <p className="font-medium">Ou use o código de pareamento:</p>
              <code className="mt-1 inline-block rounded bg-white px-2 py-1 font-mono text-sm tracking-widest dark:bg-zinc-900">
                {pairCode}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
