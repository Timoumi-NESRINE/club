"use client"

import React, { createContext, useContext } from 'react'
import { toast as shadcnToast } from "@/hooks/use-toast"

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const addToast = (toast: Omit<Toast, 'id'>) => {
    let variant: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default'
    
    switch (toast.type) {
      case 'success':
        variant = 'success'
        break
      case 'error':
        variant = 'destructive'
        break
      case 'warning':
        variant = 'warning'
        break
      case 'info':
        variant = 'info'
        break
      default:
        variant = 'default'
        break
    }
    
    shadcnToast({
      title: toast.title,
      description: toast.description,
      variant: variant as "default" | "destructive" | null | undefined,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removeToast = (_: string) => {
    // Not needed with shadcn toast system
  }

  return (
    <ToastContext.Provider value={{ toasts: [], addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
