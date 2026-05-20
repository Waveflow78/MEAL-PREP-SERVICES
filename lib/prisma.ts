import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!
  const isProduction = process.env.NODE_ENV === 'production'
  const adapter = new PrismaPg({
    connectionString,
    max: isProduction ? 1 : 10,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  })
  return new PrismaClient({
    adapter,
    log: isProduction ? ['error'] : ['error', 'warn'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
