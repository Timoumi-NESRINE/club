import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function SignOut() {
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({ redirect: false })
      router.push('/')
    }

    handleSignOut()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Déconnexion en cours...</p>
      </div>
    </div>
  )
}
