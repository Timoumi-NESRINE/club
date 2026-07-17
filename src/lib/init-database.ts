import { initializeDatabase as initDB } from './startup-seed'

// Auto-initialize when this module is imported
if (typeof window === 'undefined') { // Only run on server side
  initDB().then(() => {
    // Initialization completed
  }).catch(() => {
    // Don't throw to prevent server startup failure
    // Error is logged but handled to ensure server can start
  })
}
