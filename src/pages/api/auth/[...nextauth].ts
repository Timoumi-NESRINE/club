import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'
import { createLoginLog } from '../../../lib/login-logs-store'
import '../../../lib/init-database' // Initialize database on server startup


export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const debugAuth = process.env.NODE_ENV === 'development'

        if (debugAuth) {
          console.info('[auth] credentials authorize: start', {
            email: credentials.email,
            passwordLength: credentials.password.length,
          })
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              userRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: {
                          permission: true
                        }
                      }
                    }
                  }
                }
              }
            }
          })

          if (!user) {
            if (debugAuth) {
              console.info('[auth] user not found', { email: credentials.email })
            }
            return null
          }

          if (debugAuth) {
            console.info('[auth] user found', {
              id: user.id,
              isActive: user.isActive,
              passwordType: typeof user.password,
              passwordHashPrefix: typeof user.password === 'string' ? user.password.slice(0, 4) : 'n/a',
              roleCount: user.userRoles?.length ?? 0,
            })
          }

          // Check if account is deactivated due to inactivity
          if (!user.isActive) {
            // Return specific error message for deactivated accounts
            const deactivationReason = (user as { deactivationReason?: string }).deactivationReason
            throw new Error(deactivationReason === 'INACTIVITY_3_MONTHS' 
              ? 'ACCOUNT_DEACTIVATED_INACTIVITY' 
              : 'ACCOUNT_INACTIVE')
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (debugAuth) {
            console.info('[auth] password compare result', { isPasswordValid })
          }

          if (!isPasswordValid) {
            return null
          }

          // Log user login with IP and User-Agent
          try {
            const ipAddress = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || null
            const userAgent = req?.headers?.['user-agent'] || null
            
            await createLoginLog({
              userId: user.id,
              action: 'LOGIN',
              ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
              userAgent: userAgent,
            })
          } catch (logError) {
            console.error('Failed to log user login:', logError)
          }

          // Format user data for session - convert null to undefined for NextAuth compatibility
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            roles: user.userRoles.map((ur) => ({
              id: ur.role.id,
              name: ur.role.name,
              permissions: ur.role.rolePermissions.map((rp) => ({
                id: rp.permission.id,
                name: rp.permission.name,
                resource: rp.permission.resource || undefined,
                action: rp.permission.action || undefined
              }))
            }))
          }
        } catch (error) {
          console.error('Login error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
    secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production-minimum-32-characters-long',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.roles = user.roles
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.roles = token.roles as Array<{
          id: string;
          name: string;
          permissions: Array<{
            id: string;
            name: string;
            resource?: string;
            action?: string;
          }>;
        }>
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production-minimum-32-characters-long',
}

export default NextAuth(authOptions)
