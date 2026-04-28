// src/lib/prisma.ts - PRISMA CLIENT INSTANCE FOR ERP SYSTEM
import { PrismaClient } from '@prisma/client'

declare global {
  // Prevent multiple instances during development hot reloads
  var __prisma: PrismaClient | undefined
}

// ✅ Enhanced Prisma client for ERP system
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'colorless',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// ✅ Singleton pattern for connection pooling
const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// ✅ Enhanced error handling for ERP operations
export async function connectToDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return prisma
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw new Error('Database connection failed')
  }
}

// ✅ Graceful shutdown
export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
  }
}

// ✅ Health check for ERP system
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('❌ Database health check failed:', error)
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ✅ Transaction helper for complex ERP operations
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback, {
    maxWait: 5000, // 5 seconds max wait
    timeout: 30000, // 30 seconds timeout for complex operations
  })
}

// ✅ Bulk operations helper for ERP data imports
export async function executeBulkOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error('❌ Bulk operation failed:', error)
    throw error
  }
}

// ✅ Connection pool monitoring
export function getConnectionInfo() {
  return {
    url: process.env.DATABASE_URL?.replace(/password=[^&;]*/i, 'password=***'),
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }
}

// ✅ Export the main client instance
export default prisma

// ✅ Export specific client for different use cases
export { prisma }

// ✅ Type exports for better TypeScript support
export type { PrismaClient } from '@prisma/client'