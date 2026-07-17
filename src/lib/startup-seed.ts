import { prisma } from './prisma';
import bcryptjs from 'bcryptjs';
import { Permission, Role, User } from '@prisma/client';
import { PERMISSIONS, ROLES } from './permission';

// Variable to track if initialization has occurred
let isInitialized = false;

type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Hash password function
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

// Seed database configuration
export interface SeedConfig {
  autoSeed: boolean;
  onlyIfEmpty: boolean;
  checkEntities: Array<'users' | 'roles' | 'permissions'>;
  logging: boolean;
}

// Default seed configuration
export const defaultSeedConfig: SeedConfig = {
  autoSeed: true,
  onlyIfEmpty: true,
  checkEntities: ['users', 'roles', 'permissions'],
  logging: true
};

interface SeedResult {
  permissions: Permission[];
  roles: {
    admin: Role;
    user: Role;
    manager: Role;
  };
  users: {
    admin: User;
  };
}

/**
 * Check if database is empty based on configuration
 */
export async function isDatabaseEmpty(config: SeedConfig = defaultSeedConfig): Promise<boolean> {
  try {
    const checks = [];
    const counts: Record<string, number> = {};

    // Only check users and roles for emptiness, not permissions
    // Permissions are synced separately and don't indicate if seeding is needed
    if (config.checkEntities.includes('users')) {
      const userCount = await prisma.user.count({ where: {} });
      counts['users'] = userCount;
      checks.push(userCount === 0);
    }

    if (config.checkEntities.includes('roles')) {
      const roleCount = await prisma.role.count({ where: {} });
      counts['roles'] = roleCount;
      checks.push(roleCount === 0);
    }

    // Count permissions but don't use it for emptiness check
    if (config.checkEntities.includes('permissions')) {
      const permissionCount = await prisma.permission.count({ where: {} });
      counts['permissions'] = permissionCount;
    }

    const isEmpty = checks.every(check => check === true);
    return isEmpty;
  } catch {
    return false;
  }
}

/**
 * Seed the database with initial data
 */
export async function seedDatabase(): Promise<SeedResult> {
  try {
    // Create permissions
    const permissionsList = Object.values(PERMISSIONS) as PermissionType[];

    const createdPermissions = await Promise.all(
      permissionsList.map(async (permission) => {
        const result = await prisma.permission.upsert({
          where: { name: permission },
          update: {},
          create: {
            name: permission,
            description: permission,
            resource: permission.split(':')[0],
            action: permission.split(':')[1],
          },
        });
        return result as Permission;
      })
    );

    // Create Admin role
    const adminRole = await prisma.role.upsert({
      where: { name: ROLES.ADMIN.name },
      update: {},
      create: {
        name: ROLES.ADMIN.name,
        description: ROLES.ADMIN.description,
        isActive: true,
      },
    }) as Role;

    // Create User role
    const userRole = await prisma.role.upsert({
      where: { name: ROLES.USER.name },
      update: {},
      create: {
        name: ROLES.USER.name,
        description: ROLES.USER.description,
        isActive: true,
      },
    }) as Role;

    // Create Manager role
    const managerRole = await prisma.role.upsert({
      where: { name: ROLES.MANAGER.name },
      update: {},
      create: {
        name: ROLES.MANAGER.name,
        description: ROLES.MANAGER.description,
        isActive: true,
      },
    }) as Role;

    // Assign all permissions to Admin role
    await Promise.all(
      createdPermissions.map((permission: Permission) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        })
      )
    );

    // Assign permissions to User role
    const userPermissions = createdPermissions.filter((p: Permission) =>
      ROLES.USER.permissions.includes(p.name as typeof ROLES.USER.permissions[number])
    );
    await Promise.all(
      userPermissions.map((permission: Permission) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: userRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: userRole.id,
            permissionId: permission.id,
          },
        })
      )
    );

    // Assign permissions to Manager role
    const managerPermissions = createdPermissions.filter((p: Permission) =>
      ROLES.MANAGER.permissions.includes(p.name as typeof ROLES.MANAGER.permissions[number])
    );
    await Promise.all(
      managerPermissions.map((permission: Permission) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: managerRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: managerRole.id,
            permissionId: permission.id,
          },
        })
      )
    );

    // Create admin user
    const adminPassword = await hashPassword('admin123');

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        username: 'admin',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
      },
    }) as User;

    // Assign Admin role to admin user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });


    return {
      permissions: createdPermissions,
      roles: {
        admin: adminRole,
        user: userRole,
        manager: managerRole,
      },
      users: {
        admin: adminUser,
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error during seeding');
  }
}

/**
 * Reset the database (useful for testing)
 */
export async function resetDatabase(): Promise<void> {
  try {
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error during reset');
  }
}

/**
 * Run seeding based on configuration
 */
export async function runAutoSeed(config: SeedConfig = defaultSeedConfig): Promise<boolean> {
  try {
    if (!config.autoSeed) {
      return false;
    }

    if (config.onlyIfEmpty) {
      const isEmpty = await isDatabaseEmpty(config);

      if (!isEmpty) {
        return false;
      }
    }

    await seedDatabase();
    return true;
  } catch {
    return false;
  }
}

// Synchronize permissions with database
export async function syncPermissionsWithDatabase() {
  try {
    const allPermissions = Object.values(PERMISSIONS);

    const existingPermissions = await prisma.permission.findMany({ select: { name: true } });

    const existingNames = existingPermissions.map((p: { name: string }) => p.name);
    const missingPermissions = allPermissions.filter(p => !existingNames.includes(p));

    if (missingPermissions.length > 0) {
      await Promise.all(
        missingPermissions.map(name => {
          return prisma.permission.create({
            data: {
              name,
              description: name,
              resource: name.split(':')[0],
              action: name.split(':')[1],
            }
          });
        })
      );
    }
  } catch (error) {
    throw error; // Re-throw to be handled by initializeDatabase
  }
}

/**
 * Initialize the database connection and seed data if needed
 */
export async function initializeDatabase(config?: Partial<SeedConfig>): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    const seedConfig = { ...defaultSeedConfig, ...config };

    // Test database connection first
    await prisma.$connect();

    // Synchronise les permissions à chaque initialisation
    await syncPermissionsWithDatabase();

    if (seedConfig.autoSeed) {
      await runAutoSeed(seedConfig);
    }

    isInitialized = true;
  } catch {
    // Don't throw to prevent server startup failure
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Reset initialization status - useful for testing
 */
export function resetInitialization(): void {
  isInitialized = false;
}

/**
 * Check if the database has been initialized
 */
export function isDatabaseInitialized(): boolean {
  return isInitialized;
}

// Legacy function for backward compatibility
export async function ensureBasicDataExists() {
  await initializeDatabase();
}

// Create a named object for export
const dbUtils = {
  prisma,
  initializeDatabase,
  resetInitialization,
  isDatabaseInitialized,
  seedDatabase,
  resetDatabase,
  PERMISSIONS,
  ROLES
};

export default dbUtils;
