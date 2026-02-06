import "dotenv/config"
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
    connectionString: process.env.DB_URL!,
})

const prisma = new PrismaClient({ adapter })

export { prisma }
