import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

// Skip database setup for unit tests that don't need it
if (process.env.NODE_ENV !== 'test' || process.argv.includes('--integration')) {
  beforeAll(async () => {
    // Reset database before tests
    try {
      execSync('npx prisma migrate reset --force --skip-generate', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: 'file:./test.db' }
      })
    } catch (error) {
      console.warn('Database reset failed, continuing with tests')
    }
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })
}