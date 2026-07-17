import { useState, useEffect, useCallback } from 'react'
import { User, Role } from '../../types'
import { Modal, ModalFooter } from '../ui/modal'
import { Button } from '../ui/button'
import { useToast } from '../ui/toast-compat'
import { useTranslation } from '@/lib/hooks/useTranslation'
import CustomIcon from '../ui/CustomIcon'

interface UserFormProps {
  user?: User | null
  isOpen: boolean
  onSave: (user: User) => void
  onCancel: () => void
}

export default function UserForm({ user, isOpen, onSave, onCancel }: UserFormProps) {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    isActive: true,
    roleId: '' as string,
  })
  const [roles, setRoles] = useState<Role[]>([])
  const [roleSearch, setRoleSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasDigit: false,
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchRoles()
    if (user) {
      setFormData({
        email: user.email,
        username: user.username,
        password: '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        isActive: user.isActive,
        roleId: user.userRoles?.[0]?.role?.id || '',
      })
    }
  }, [user])

  const validatePassword = useCallback((password: string) => {
    if (!password && user) return { minLength: true, hasUppercase: true, hasDigit: true }
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasDigit: /\d/.test(password),
    }
  }, [user])

  useEffect(() => {
    setPasswordValidation(validatePassword(formData.password))
  }, [formData.password, validatePassword])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles?limit=100')
      const data = await response.json()
      if (response.ok) {
        setRoles(data.roles)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PUT' : 'POST'

      const { roleId, ...rest } = formData
      const payload: {
        email: string
        username: string
        password?: string
        firstName: string
        lastName: string
        isActive: boolean
        roleIds: string[]
      } = {
        ...rest,
        roleIds: roleId ? [roleId] : []
      }

      if (user && !payload.password) {
        delete payload.password
      }

      // Validate password policy
      if (formData.password) {
        const validation = validatePassword(formData.password)
        if (!validation.minLength || !validation.hasUppercase || !validation.hasDigit) {
          const errorMsg = t('users.passwordPolicyError')
          setErrors({ general: errorMsg })
          addToast({
            type: 'error',
            title: t('users.saveError'),
            description: errorMsg
          })
          setLoading(false)
          return
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          type: 'success',
          title: user ? t('users.updateSuccess') : t('users.createSuccess'),
          description: user
            ? t('users.updateSuccessDescription', { name: `${data.user.firstName} ${data.user.lastName}` })
            : t('users.createSuccessDescription', { name: `${data.user.firstName} ${data.user.lastName}` })
        })
        onSave(data.user)
      } else {
        if (response.status === 400 || response.status === 409) {
          setErrors({ general: data.error })
          addToast({
            type: 'error',
            title: t('users.saveError'),
            description: data.error
          })
        } else {
          const errorMsg = t('users.saveErrorDescription')
          setErrors({ general: errorMsg })
          addToast({
            type: 'error',
            title: t('users.saveError'),
            description: errorMsg
          })
        }
      }
    } catch (error) {
      console.error('Error saving user:', error)
      const errorMsg = t('users.saveErrorDescription')
      setErrors({ general: errorMsg })
      addToast({
        type: 'error',
        title: t('users.saveError'),
        description: errorMsg
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleRoleChange = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleId,
    }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={user ? t('users.editUser') : t('users.addUser')}
      size="lg"
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 -m-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {user ? t('users.editUser') : t('users.addUser')}
            </h3>
            <p className="text-sm text-gray-600">
              {user ? t('users.editUserDescription') : t('users.createUserDescription')}
            </p>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <div className="p-1 bg-red-100 rounded-lg">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-medium">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Informations de connexion */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <CustomIcon name="Mail" className="w-4 h-4" iconType="custom" invert={false} />
            </div>
            <h4 className="font-semibold text-gray-900">{t('users.loginInfo')}</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('common.email')} *
              </label>
              <div className="relative flex items-center">
                <CustomIcon name="Mail" className="absolute left-7 h-5 w-5 pointer-events-none z-10" iconType="custom" invert={false} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-900 bg-white/80 backdrop-blur-sm"
                  placeholder="utilisateur@exemple.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('users.username')} *
              </label>
              <div className="relative flex items-center">
                <CustomIcon name="User" className="absolute left-7 h-5 w-5 pointer-events-none z-10" iconType="custom" invert={false} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-900 bg-white/80 backdrop-blur-sm"
                  placeholder="nom_utilisateur"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('users.password')} {!user && '*'}
          </label>
          <div className="relative flex items-center">
            <CustomIcon name="Shield" className="absolute left-7 h-5 w-5 pointer-events-none z-10" iconType="custom" invert={false} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              placeholder={user ? t('users.passwordPlaceholder') : ''}
              className="w-full pl-14 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-900 bg-white/80 backdrop-blur-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors z-10"
              title={showPassword ? t('users.hidePassword') : t('users.showPassword')}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {formData.password && (
            <div className="mt-2 space-y-1 text-xs">
              <div className={`flex items-center gap-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-red-500'}`}>
                <span className="text-base leading-none">{passwordValidation.minLength ? '✓' : '×'}</span>
                <span>{t('users.passwordMinLength')}</span>
              </div>
              <div className={`flex items-center gap-1 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-red-500'}`}>
                <span className="text-base leading-none">{passwordValidation.hasUppercase ? '✓' : '×'}</span>
                <span>{t('users.passwordUppercase')}</span>
              </div>
              <div className={`flex items-center gap-1 ${passwordValidation.hasDigit ? 'text-green-600' : 'text-red-500'}`}>
                <span className="text-base leading-none">{passwordValidation.hasDigit ? '✓' : '×'}</span>
                <span>{t('users.passwordDigit')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('users.firstName')}
            </label>
            <div className="relative flex items-center">
              <CustomIcon name="User" className="absolute left-7 h-5 w-5 pointer-events-none z-10" iconType="custom" invert={false} />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('users.lastName')}
            </label>
            <div className="relative flex items-center">
              <CustomIcon name="User" className="absolute left-7 h-5 w-5 pointer-events-none z-10" iconType="custom" invert={false} />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">{t('users.active')}</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('users.roles')}
          </label>
          <input
            type="text"
            placeholder={t('common.search')}
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          />
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
            {roles
              .filter(role => role.name.toLowerCase().includes(roleSearch.toLowerCase()))
              .map((role) => (
                <label key={role.id} className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value={role.id}
                    checked={formData.roleId === role.id}
                    onChange={() => handleRoleChange(role.id)}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {role.name}
                  </span>
                </label>
              ))}
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="bg-[#149fad] hover:bg-[#117a85] text-white"
          >
            {user ? t('common.update') : t('common.create')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
