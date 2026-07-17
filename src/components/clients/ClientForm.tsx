import { useEffect, useState } from 'react'
import { Client } from '../../types'
import { Modal, ModalFooter } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useToast } from '../ui/toast-compat'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { User, MapPin } from 'lucide-react'
import { z } from 'zod'
import AddressPicker from './AddressPicker'

interface ClientFormProps {
  client?: Client | null
  isOpen: boolean
  onSave: (client: Client) => void
  onCancel: () => void
}

export default function ClientForm({ client, isOpen, onSave, onCancel }: ClientFormProps) {
  const { addToast } = useToast()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    mail: '',
    phone: '',
    adresse: '',
    codePostal: '',
    region: '',
    pays: '',
    dateAdhesion: '',
    codeAgence: '',
  })

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || '',
        prenom: client.prenom || '',
        mail: client.mail || '',
        phone: client.phone || '',
        adresse: client.adresse || '',
        codePostal: client.codePostal || '',
        region: client.region || '',
        pays: client.pays || '',
        dateAdhesion: client.dateAdhesion ? new Date(client.dateAdhesion).toISOString().slice(0, 10) : '',
        codeAgence: client.codeAgence || '',
      })
    } else {
      setFormData({
        nom: '',
        prenom: '',
        mail: '',
        phone: '',
        adresse: '',
        codePostal: '',
        region: '',
        pays: '',
        dateAdhesion: '',
        codeAgence: '',
      })
    }
  }, [client])

  const schema = z.object({
    nom: z.string().trim().min(1, t('clients.validation.lastNameRequired')),
    prenom: z.string().trim().min(1, t('clients.validation.firstNameRequired')),
    mail: z.string().trim().min(1, t('clients.validation.emailRequired')).email(t('clients.validation.invalidEmail')),
    dateAdhesion: z.string().trim().min(1, t('clients.validation.joinDateRequired')),
    phone: z.string().optional(),
    adresse: z.string().optional(),
    codePostal: z.string().optional(),
    region: z.string().optional(),
    pays: z.string().optional(),
    codeAgence: z.string().optional(),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setFieldErrors({})

    const parsed = schema.safeParse(formData)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !nextErrors[key]) {
          nextErrors[key] = issue.message
        }
      }
      setFieldErrors(nextErrors)
      setLoading(false)
      return
    }

    try {
      const url = client ? `/api/clients/${client.id}` : '/api/clients'
      const method = client ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          type: 'success',
          title: client ? t('common.update') : t('common.create'),
          description: client ? t('common.updated') : t('common.created'),
        })
        onSave(data.client)
      } else {
        const errorMsg = data.error || t('common.error')
        setErrors({ general: errorMsg })
        addToast({
          type: 'error',
          title: t('common.error'),
          description: errorMsg,
        })
      }
    } catch (error) {
      console.error('Error saving client:', error)
      const errorMsg = t('common.error')
      setErrors({ general: errorMsg })
      addToast({
        type: 'error',
        title: t('common.error'),
        description: errorMsg,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={client ? t('clients.editClient') : t('clients.addClient')}
      size="xl"
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 -m-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {client ? t('clients.editClient') : t('clients.addClient')}
            </h3>
            <p className="text-sm text-gray-600">
              {client ? t('clients.updateInfo') : t('clients.createNew')}
            </p>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 rounded-xl">
          <span className="font-medium">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <User className="w-4 h-4 text-[#149fad]" />
            </div>
            <h4 className="font-semibold text-gray-900">{t('clients.clientInfo')}</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.lastName')} *</label>
              <div className="relative flex items-center">
                <Input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="pl-14 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
              {fieldErrors.nom && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.nom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.firstName')} *</label>
              <div className="relative flex items-center">
                <Input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className="pl-14 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
              {fieldErrors.prenom && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.prenom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.email')} *</label>
              <div className="relative flex items-center">
                <Input
                  type="email"
                  name="mail"
                  value={formData.mail}
                  onChange={handleChange}
                  className="pl-14 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
              {fieldErrors.mail && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.mail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.phone')}</label>
              <div className="relative flex items-center">
                <Input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-14 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <AddressPicker
                value={{
                  adresse: formData.adresse,
                  codePostal: formData.codePostal,
                  region: formData.region,
                  pays: formData.pays,
                }}
                onChange={(v) => {
                  setFormData((prev) => ({
                    ...prev,
                    adresse: v.adresse ?? prev.adresse,
                    codePostal: v.codePostal ?? prev.codePostal,
                    region: v.region ?? prev.region,
                    pays: v.pays ?? prev.pays,
                  }))
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.address')}</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MapPin className="h-4 w-4 text-[#149fad]" />
                </div>
                <textarea
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500 resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.postalCode')}</label>
              <Input
                type="text"
                name="codePostal"
                value={formData.codePostal}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.region')}</label>
              <Input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.country')}</label>
              <Input
                type="text"
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.joinDate')} *</label>
              <div className="relative flex items-center">
                <Input
                  type="date"
                  name="dateAdhesion"
                  value={formData.dateAdhesion}
                  onChange={handleChange}
                  className="pl-14 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
              {fieldErrors.dateAdhesion && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.dateAdhesion}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.agencyCode')}</label>
              <Input
                type="text"
                name="codeAgence"
                value={formData.codeAgence}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="bg-[#149fad] hover:bg-[#117a85] text-white"
          >
            {client ? t('common.update') : t('common.create')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
