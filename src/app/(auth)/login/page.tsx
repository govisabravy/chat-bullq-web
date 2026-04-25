'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { AuthCard } from '@/features/auth/components/auth-card';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/login.schema';
import { authService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setActiveOrg } = useAuthStore();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const { isSubmitting } = form.formState;

  const registerEmail = form.register('email');
  const registerPassword = form.register('password');

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await authService.login(data);

      localStorage.setItem('access_token', result.accessToken);
      localStorage.setItem('refresh_token', result.refreshToken);

      setAuth(result.user, result.organizations);
      if (result.organizations.length > 0) {
        setActiveOrg(result.organizations[0].id);
      }

      toast.success(`Bem-vindo, ${result.user.name}!`);
      router.push('/inbox');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  return (
    <AuthCard
      title="Entrar"
      description="Acesse o painel do BullQ"
      footer={
        <>
          Não tem conta?{' '}
          <Link className="text-primary hover:underline" href="/register">
            Criar
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Email">
          <Input
            type="email"
            placeholder="email@empresa.com"
            autoComplete="email"
            invalid={!!form.formState.errors.email}
            {...registerEmail}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </Field>

        <Field label="Senha">
          <Input
            type="password"
            autoComplete="current-password"
            invalid={!!form.formState.errors.password}
            {...registerPassword}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </Field>

        <Button variant="primary" className="w-full" loading={isSubmitting} type="submit">
          Entrar
        </Button>
      </form>
    </AuthCard>
  );
}
