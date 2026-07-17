import { Permission } from '../types'

// Fonction pour traduire les noms de permissions
export function translatePermissionName(permission: Permission, language: string = 'en'): string {
  void language
  return permission.name
}

// Fonction pour traduire les descriptions de permissions
export function translatePermissionDescription(permission: Permission, language: string = 'en'): string {
  void language
  return permission.description || ''
}

// Fonction pour traduire les noms de ressources
export function translateResourceName(resource: string, language: string = 'en'): string {
  void language
  return resource
}

// Fonction pour traduire les actions
export function translateActionName(action: string, language: string = 'en'): string {
  void language
  return action
}
