// src/pages/Register.tsx
import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'

import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

type FormValues = {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
}

export default function RegisterPage(): JSX.Element {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { nome: '', email: '', senha: '', confirmarSenha: '' },
  })

  const mutation = useMutation({
    mutationFn: async (payload: { nome: string; email: string; senha: string }) => {
      // Ajuste as chaves do payload abaixo se seu backend esperar nomes diferentes
      // Exemplo: { name, email, password } -> nesta API de exemplo usamos nome/email/senha
      const res = await api.post('/api/v1/instrutores/register', payload)
      return res.data
    },
  })

  const onSubmit = async (values: FormValues) => {
    // validação extra: confirma senhas
    if (values.senha !== values.confirmarSenha) {
      // O react-hook-form já mostra isso, mas deixamos uma salvaguarda
      return
    }

    mutation.mutate({
      nome: values.nome,
      email: values.email,
      senha: values.senha,
    })
  }

  // se sucesso: redireciona para /login depois de mostrar mensagem
  useEffect(() => {
    if (mutation.isSuccess) {
      // redirecionar com pequena pausa para o usuário ver a mensagem
      const t = setTimeout(() => navigate('/login', { replace: true }), 1600)
      return () => clearTimeout(t)
    }
  }, [mutation.isSuccess, navigate])

  // extrair mensagem de erro amigável
  const apiErrorMessage = (() => {
    if (!mutation.isError) return null
    const e: any = mutation.error
    return (
      e?.response?.data?.detail ||
      e?.response?.data?.message ||
      e?.message ||
      'Erro ao registrar. Verifique os dados e tente novamente.'
    )
  })()

  const senhaValue = watch('senha')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">Crie sua conta — CoreFlowFit</h1>
          <p className="text-sm text-slate-500 mt-1">Cadastre-se como personal trainer</p>
        </div>

        {mutation.isSuccess && (
          <div className="mb-4">
            <Alert
              type="success"
              title="Cadastro concluído"
              description="Conta criada com sucesso! Redirecionando para o login..."
              dismissible
            />
          </div>
        )}

        {apiErrorMessage && (
          <div className="mb-4">
            <Alert type="error" title="Erro no cadastro" description={apiErrorMessage} dismissible />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface p-6 rounded-2xl shadow-card">
          <div className="space-y-4">
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              {...register('nome', {
                required: 'O nome é obrigatório',
                minLength: { value: 2, message: 'Informe um nome válido' },
              })}
              error={errors.nome?.message}
            />

            <Input
              label="Email"
              type="email"
              placeholder="seu@exemplo.com"
              {...register('email', {
                required: 'O email é obrigatório',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
              })}
              error={errors.email?.message}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              {...register('senha', {
                required: 'A senha é obrigatória',
                minLength: { value: 8, message: 'A senha deve ter pelo menos 8 caracteres' },
              })}
              error={errors.senha?.message}
            />

            <Input
              label="Confirmar senha"
              type="password"
              placeholder="Repita a senha"
              {...register('confirmarSenha', {
                required: 'Confirme sua senha',
                validate: (v) => v === senhaValue || 'As senhas não conferem',
              })}
              error={errors.confirmarSenha?.message}
            />
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={mutation.isLoading}
              disabled={!isValid && !mutation.isLoading}
              className="w-full"
            >
              {mutation.isLoading ? 'Cadastrando...' : 'Criar conta'}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-slate-500">Já tem conta? </span>
            <Link to="/login" className="text-primary hover:underline">
              Fazer login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
