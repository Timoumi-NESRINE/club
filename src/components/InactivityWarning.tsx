'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, LogOut, RefreshCw } from 'lucide-react'
import { useInactivityDetector } from '@/lib/hooks/useInactivityDetector'

export function InactivityWarning() {
  const { t } = useTranslation()
  const { showWarning, timeRemaining, handleStayActive, handleLogout } = useInactivityDetector()
  const [progress, setProgress] = useState(100)

  // Format time remaining
  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Update progress bar
  useEffect(() => {
    if (showWarning && timeRemaining > 0) {
      const progressPercent = (timeRemaining / (15 * 1000)) * 100
      setProgress(progressPercent)
    }
  }, [showWarning, timeRemaining])

  if (!showWarning) return null

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-50 border-none shadow-2xl rounded-2xl overflow-hidden">
        {/* Animated pulse background */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 via-orange-100/50 to-red-100/50 animate-pulse" />
        
        {/* Top warning bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

        <div className="relative z-10">
          <DialogHeader className="space-y-4 pt-2">
            {/* Icon with animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20" />
                <div className="relative p-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full shadow-lg">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {t('common.sessionExpiring')}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
                {t('common.sessionExpiringDesc', { action: t('common.stayConnected') })}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Timer display */}
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-4xl font-bold text-gray-900 tracking-tight">
                {formatTime(timeRemaining)}
              </span>
            </div>
            
            {/* Progress bar with gradient */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-1000 ease-linear rounded-full shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-gray-500">
              {t('common.timeRemaining', { time: formatTime(timeRemaining) })}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 h-12 border-gray-300 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('common.disconnect')}
            </Button>
            <Button
              onClick={handleStayActive}
              className="flex-1 h-12 bg-gradient-to-r from-[#149fad] to-[#117a85] hover:from-[#117a85] hover:to-[#0d5f68] text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.stayConnected')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
