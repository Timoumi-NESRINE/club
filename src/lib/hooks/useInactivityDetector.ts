'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

// 30 minutes in milliseconds
const INACTIVITY_TIMEOUT = 30 * 60 * 1000
// Warning shown 1 minute before logout
const WARNING_TIME = 60 * 1000

export function useInactivityDetector() {
  const { data: session, update } = useSession()
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(INACTIVITY_TIMEOUT)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(0)

  const handleLogout = useCallback(async () => {
    // Call logout API to log the logout action
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch (error) {
      console.error('Error logging logout:', error)
    }
    
    await signOut({ callbackUrl: '/' })
  }, [])

  const resetTimer = useCallback(async () => {
    const now = Date.now()
    // Throttle: only reset if 30 seconds have passed since last reset
    if (now - lastActivityRef.current < 30000) {
      return
    }
    
    // Send activity ping to server to update lastActiveAt
    if (session?.user?.id) {
      try {
        await fetch('/api/users/activity', { method: 'POST' })
      } catch {
        // Silent fail - server will handle session timeout
      }
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    // Send activity ping to server to update lastActiveAt
    if (session?.user?.id) {
      try {
        await fetch('/api/users/activity', { method: 'POST' })
      } catch {
        // Silent fail - server will handle session timeout
      }
    }

    // Set warning timer (30 seconds before logout)
    const warningDelay = INACTIVITY_TIMEOUT - WARNING_TIME
    warningRef.current = setTimeout(() => {
      setShowWarning(true)
      setTimeRemaining(WARNING_TIME)
    }, warningDelay)

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout()
    }, INACTIVITY_TIMEOUT)
  }, [session?.user?.id, handleLogout])

  const handleStayActive = useCallback(() => {
    resetTimer()
    update() // Refresh session
  }, [resetTimer, update])

  useEffect(() => {
    if (!session) return

    // Activity events to track (removed mousemove to reduce API calls)
    const activityEvents = [
      'mousedown', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'
    ]

    const handleActivity = () => {
      resetTimer()
    }

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Initial timer setup
    resetTimer()

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, [session, resetTimer])

  // Separate effect for countdown that doesn't re-run when showWarning changes
  useEffect(() => {
    if (!showWarning) return

    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = Math.max(0, INACTIVITY_TIMEOUT - elapsed)
      setTimeRemaining(remaining)
      
      if (remaining <= 0) {
        handleLogout()
      }
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [showWarning, handleLogout])

  return {
    showWarning,
    timeRemaining,
    handleStayActive,
    handleLogout
  }
}
