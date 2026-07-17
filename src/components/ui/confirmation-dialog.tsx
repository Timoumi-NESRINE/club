import React from 'react'
import { Modal, ModalFooter } from './modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
    >
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 ${
          variant === 'destructive' ? 'text-red-500' : 'text-yellow-500'
        }`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            {message}
          </p>
        </div>
      </div>

      <ModalFooter className="mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            variant === 'destructive'
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'
          }`}
        >
          {confirmText}
        </button>
      </ModalFooter>
    </Modal>
  )
}

// Hook pour utiliser facilement le dialog de confirmation
export function useConfirmationDialog() {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const showConfirmation = React.useCallback((options: {
    title: string
    message: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
  }) => {
    setDialog({
      isOpen: true,
      ...options,
    })
  }, [])

  const hideConfirmation = React.useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  const ConfirmationDialogComponent = React.useCallback(() => (
    <ConfirmationDialog
      isOpen={dialog.isOpen}
      onClose={hideConfirmation}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      message={dialog.message}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      variant={dialog.variant}
    />
  ), [dialog, hideConfirmation])

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationDialog: ConfirmationDialogComponent,
  }
}
