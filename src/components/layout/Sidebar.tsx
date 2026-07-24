import Link from 'next/link'

import { useRouter } from 'next/router'

import { usePermissions } from '../../hooks/usePermissions'

import { useTranslation } from '@/lib/hooks/useTranslation'

import { useColors } from '../../contexts/ColorContext'

import {

  X,

} from 'lucide-react'



import CustomIcon, { IconName } from '../ui/CustomIcon'



interface SidebarProps {

  sidebarOpen: boolean

  sidebarCollapsed: boolean

  setSidebarOpen: (open: boolean) => void

}



export default function Sidebar({ sidebarOpen, sidebarCollapsed, setSidebarOpen }: SidebarProps) {

  const router = useRouter()

  const { t } = useTranslation()

  const { currentTheme } = useColors()

  const { canAccessUsers, canAccessRoles, canAccessPermissions } = usePermissions()



  const navigation: { name: string; href: string; icon: IconName; permission?: string; description?: string; iconType?: 'lucide' | 'custom' }[] = [

    {

      name: t('navigation.dashboard'),

      href: '/admin',

      icon: 'Home',

      iconType: 'custom',

      permission: 'dashboard:read'



    },

    ...(canAccessUsers() ? [{

      name: t('admin.users'),

      href: '/admin/users',

      icon: 'User' as IconName,

      permission: 'users:read'

    }] : []),

    ...(canAccessUsers() ? [{

      name: 'Clients',

      href: '/admin/clients',

      icon: 'User' as IconName,

      permission: 'clients:read'

    }] : []),

    ...(canAccessRoles() ? [{

      name: t('admin.roles'),

      href: '/admin/roles',

      icon: 'Shield' as IconName,

      permission: 'roles:read',



    }] : []),

    ...(canAccessPermissions() ? [{

      name: t('admin.permissions'),

      href: '/admin/permissions',

      icon: 'Lock' as IconName,

      permission: 'permissions:read',



    }] : []),

    

    ...(canAccessUsers() ? [{

      name: t('admin.historyLogs'),

      href: '/admin/login-logs',

      icon: 'History' as IconName,

      permission: 'historyLogs:read'

    }] : []),

    ...(canAccessUsers() ? [{

      name: 'Thèmes & Couleurs',

      href: '/admin/colors',

      icon: 'Sparkles' as IconName,

      description: 'Personnalisez l\'apparence de l\'application'

    }] : []),

    ...(canAccessUsers() ? [{

      name: 'AI Command Center',

      href: '/admin/ai-command-center',

      icon: 'Sparkles' as IconName,

      description: 'Agents IA, Leads & Automation'

    }] : []),

    ...(canAccessUsers() ? [{

      name: '↳ Agents Status',

      href: '/admin/ai-command-center/agents',

      icon: 'Activity' as IconName,

    }] : []),

    ...(canAccessUsers() ? [{

      name: '↳ Leads & Pipeline',

      href: '/admin/ai-command-center/leads',

      icon: 'TrendingUp' as IconName,

    }] : []),

    ...(canAccessUsers() ? [{

      name: '↳ Propositions',

      href: '/admin/ai-command-center/proposals',

      icon: 'Mail' as IconName,

    }] : []),

    ...(canAccessUsers() ? [{

      name: '↳ Marketing & Blog',

      href: '/admin/ai-command-center/marketing',

      icon: 'Megaphone' as IconName,

    }] : []),

    

  ]



  const isCurrentPath = (href: string) => {

    if (href === '/admin') {

      return router.pathname === '/admin'

    }

    return router.pathname.startsWith(href)

  }



  return (

    <div

      className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'} shadow-lg transform lg:translate-x-0 lg:static lg:inset-0 transition-all duration-300 ease-in-out mt-16 lg:mt-0 flex flex-col`}

      style={{

        background: currentTheme.sidebarBackground,

        borderRight: `1px solid ${currentTheme.sidebarBorder}`

      }}

    >

      {/* Sidebar header removed */}

      {/* Mobile header */}

      <div className="lg:hidden flex items-center justify-between h-16 px-6 border-b border-gray-200 shrink-0">

        <h1 className="text-lg font-bold text-gray-900">{t('sidebar.menu')}</h1>

        <button

          onClick={() => setSidebarOpen(false)}

          className="text-gray-500 hover:text-gray-700"

        >

          <X className="w-5 h-5" />

        </button>

      </div>



      <nav className="mt-6 px-3 flex-1 overflow-y-auto custom-scrollbar">

        <div className="space-y-1">

          {navigation.map((item) => (

            <div key={item.name}>

              <Link

                href={item.href}

                className="group flex items-center px-3 py-2 text-sm font-medium rounded-l-md transition-all duration-200 relative"

                style={{

                  background: isCurrentPath(item.href)

                    ? currentTheme.sidebarActiveBackground

                    : 'transparent',

                  color: isCurrentPath(item.href)

                    ? currentTheme.sidebarActiveText

                    : currentTheme.sidebarText,

                  borderRight: isCurrentPath(item.href)

                    ? `3px solid ${currentTheme.sidebarTextHover}`

                    : 'none',

                  boxShadow: isCurrentPath(item.href)

                    ? '0 4px 12px rgba(0, 0, 0, 0.15)'

                    : 'none'

                }}

                onMouseEnter={(e) => {

                  if (!isCurrentPath(item.href)) {

                    e.currentTarget.style.color = currentTheme.sidebarTextHover

                    e.currentTarget.style.backgroundColor = `${currentTheme.sidebarTextHover}10`

                  }

                }}

                onMouseLeave={(e) => {

                  if (!isCurrentPath(item.href)) {

                    e.currentTarget.style.color = currentTheme.sidebarText

                    e.currentTarget.style.backgroundColor = 'transparent'

                  }

                }}

                title={sidebarCollapsed ? item.name : undefined}

              >

                <div className={`${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`}>

                  <CustomIcon name={item.icon} className="w-5 h-5" iconType={item.iconType || currentTheme.iconType} />

                </div>

                {!sidebarCollapsed && (

                  <div className="flex-1">

                    <div className="font-medium">{item.name}</div>



                  </div>

                )}

                {sidebarCollapsed && (

                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">

                    {item.name}

                  </div>

                )}

              </Link>

            </div>

          ))}

        </div>

      </nav>

    </div>

  )

}

