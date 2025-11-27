// src/pages/Login.tsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock } from 'lucide-react'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import { useLogin } from '@/hooks/useAuth'

type FormValues = {
  email: string
  senha: string
}

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate()
  const mutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: 'onChange', // validação em tempo real
    defaultValues: { email: '', senha: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync(values)
      // login bem-sucedido: redireciona
      navigate('/dashboard', { replace: true })
    } catch (err) {
      // o Alert exibirá a mensagem automática a partir de mutation.error
    }
  }

  // extrai mensagem de erro amigável (tenta payload do backend)
  const apiErrorMessage = (() => {
    if (!mutation.isError) return null
    const e: any = mutation.error
    // checar várias formas comuns de resposta de erro
    return (
      e?.response?.data?.detail ||
      e?.response?.data?.message ||
      e?.message ||
      'Erro ao autenticar. Verifique suas credenciais.'
    )
  })()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">CoreFlowFit</h1>
          <p className="text-sm text-slate-500 mt-1">Entre na sua conta</p>
        </div>

        {apiErrorMessage && (
          <div className="mb-4">
            <Alert type="error" title="Falha no login" description={apiErrorMessage} dismissible onDismiss={() => {}} />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface p-6 rounded-2xl shadow-card">
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="seu@exemplo.com"
              leftIcon={<Mail className="w-4 h-4" />}
              {...register('email', {
                required: 'O email é obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido',
                },
              })}
              error={errors.email?.message}
              aria-invalid={!!errors.email}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              {...register('senha', {
                required: 'A senha é obrigatória',
                minLength: { value: 6, message: 'Mínimo de 6 caracteres' },
              })}
              error={errors.senha?.message}
              aria-invalid={!!errors.senha}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-slate-500">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="form-checkbox" /> <span>Manter-me conectado</span>
              </label>
            </div>

            <Link to="/register" className="text-sm text-primary hover:underline">
              Não tem conta? Cadastre-se
            </Link>
          </div>

          <div className="mt-6">
            <Button type="submit" variant="primary" size="md" loading={mutation.isLoading} disabled={!isValid && !mutation.isLoading} className="w-full">
              {mutation.isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center text-xs text-slate-400">
          Ao continuar, você concorda com nossos <Link to="/terms" className="underline">Termos</Link> e <Link to="/privacy" className="underline">Política de Privacidade</Link>.
        </div>
      </div>
    </div>
  )
}
