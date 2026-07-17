"use client"

import React from 'react'
import { Button } from './button'
import { useToast } from './toast-compat'

export function ToastTest() {
  const { addToast } = useToast()

  const testSuccess = () => {
    addToast({
      type: 'success',
      title: 'Succès',
      description: 'Utilisateur créé avec succès'
    })
  }

  const testError = () => {
    addToast({
      type: 'error',
      title: 'Erreur',
      description: 'Une erreur s\'est produite'
    })
  }

  const testWarning = () => {
    addToast({
      type: 'warning',
      title: 'Avertissement',
      description: 'Attention à cette action'
    })
  }

  const testInfo = () => {
    addToast({
      type: 'info',
      title: 'Information',
      description: 'Voici une information utile'
    })
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Test des Toasts</h3>
      <div className="flex gap-2">
        <Button onClick={testSuccess} variant="default">
          Test Succès
        </Button>
        <Button onClick={testError} variant="destructive">
          Test Erreur
        </Button>
        <Button onClick={testWarning} variant="outline">
          Test Warning
        </Button>
        <Button onClick={testInfo} variant="secondary">
          Test Info
        </Button>
      </div>
    </div>
  )
}
