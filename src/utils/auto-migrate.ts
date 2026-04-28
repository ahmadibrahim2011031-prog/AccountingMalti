// Auto-migration script that runs on app startup
// Adds missing database fields automatically

import { prisma } from './prisma'

export async function autoMigrate() {
  try {
    console.log('🔍 Checking database schema...')

    // Check if transferredToHR column exists
    const columns = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'driver_payslips'
      AND COLUMN_NAME = 'transferredToHR'
    `) as any[]

    if (columns.length === 0) {
      console.log('⚡ Adding Transfer to HR fields to database...')

      await prisma.$executeRawUnsafe(`
        ALTER TABLE driver_payslips
        ADD COLUMN transferredToHR BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN transferredAt DATETIME(3) NULL,
        ADD COLUMN operationsApprovedBy VARCHAR(191) NULL
      `)

      console.log('✅ Transfer to HR fields added successfully!')
    } else {
      console.log('✅ Database schema is up to date')
    }

  } catch (error: any) {
    // If columns already exist, that's fine
    if (error.message.includes('Duplicate column')) {
      console.log('✅ Database schema is up to date')
    } else {
      console.error('❌ Auto-migration error:', error.message)
      // Don't crash the app, just log the error
    }
  }
}
