// src/components/ui/ApiAlert.tsx
import React from 'react'
import Alert from './Alert'
import { getApiErrorMessage } from '@/utils/apiErrors'

type Props = {
  error?: unknown
  title?: string
  onDismiss?: () => void
}

export default function ApiAlert({ error, title = 'Erro', onDismiss }: Props) {
  if (!error) return null
  const message = getApiErrorMessage(error)
  return <Alert type="error" title={title} description={message} dismissible onDismiss={onDismiss} />
}
