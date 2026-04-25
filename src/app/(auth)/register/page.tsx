'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { AuthCard } from '@/features/auth/components/auth-card';
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas/register.schema';
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

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, setActiveOrg } = useAuthStore();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const { isSubmitting } = form.formState;

  const registerName = form.register('name');
  const registerEmail = form.register('email');
  const passwordRegistration = form.register('password');
  const registerPassword = {
    ...passwordRegistration,
    onChange: async (event: React.ChangeEvent<HTMLInputElement>) => {
      await passwordRegistration.onChange(event);
      form.setValue('confirmPassword', event.target.value, { shouldValidate: false });
    },
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      localStorage.setItem('access_token', result.accessToken);
      localStorage.setItem('refresh_token', result.refreshToken);

      setAuth(result.user, [result.organization]);
      setActiveOrg(result.organization.id);

      toast.success('Conta criada com sucesso!');
      router.push('/inbox');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar conta');
    }
  };

  return (
    <AuthCard
      title="Criar conta"
      description="Crie sua conta para começar"
      footer={
        <>
          Já tem conta?{' '}
          <Link className="text-primary hover:underline" href="/login">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Nome">
          <Input
            type="text"
            placeholder="Seu nome"
            autoComplete="name"
            invalid={!!form.formState.errors.name}
            {...registerName}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </Field>

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
            autoComplete="new-password"
            invalid={!!form.formState.errors.password}
            {...registerPassword}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </Field>

        <Button variant="primary" className="w-full" loading={isSubmitting} type="submit">
          Criar conta
        </Button>
      </form>
    </AuthCard>
  );
}
