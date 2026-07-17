import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query
  const { data: session, status } = useSession()

  // Si l'utilisateur est déjà authentifié, le rediriger vers le dashboard
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/admin')
    }
  }, [status, session, router])

  const getErrorMessage = (error: string | string[] | undefined) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Email ou mot de passe incorrect'
      case 'AccessDenied':
        return 'Accès refusé'
      case 'Verification':
        return 'Erreur de vérification'
      case 'Configuration':
        return 'Erreur de configuration. Veuillez réessayer.'
      case 'Default':
        return 'Une erreur inattendue est survenue'
      default:
        return 'Une erreur est survenue lors de la connexion'
    }
  }

  // Si on est en train de charger la session, afficher un loader
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Erreur d&apos;authentification
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Réessayer la connexion
          </Link>
          
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
