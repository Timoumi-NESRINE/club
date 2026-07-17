import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      firstName?: string
      lastName?: string
      roles: Array<{
        id: string
        name: string
        permissions: Array<{
          id: string
          name: string
          resource?: string
          action?: string
        }>
      }>
    }
  }

  interface User {
    id: string
    email: string
    username: string
    firstName?: string
    lastName?: string
    roles: Array<{
      id: string
      name: string
      permissions: Array<{
        id: string
        name: string
        resource?: string
        action?: string
      }>
    }>
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    firstName?: string
    lastName?: string
    roles: Array<{
      id: string
      name: string
      permissions: Array<{
        id: string
        name: string
        resource?: string
        action?: string
      }>
    }>
  }
}
