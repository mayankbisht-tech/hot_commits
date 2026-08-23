import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Execute a database query with automatic reconnection and retry on transient connection drops
 */
export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      attempt++;
      const isConnectionError = 
        err?.message?.includes('Server has closed the connection') ||
        err?.message?.includes('Connection closed') ||
        err?.message?.includes('Can\'t reach database server') ||
        err?.message?.includes('Connection terminated') ||
        err?.code === 'P1001' ||
        err?.code === 'P1017';

      if (isConnectionError && attempt <= maxRetries) {
        try {
          await prisma.$disconnect();
          await prisma.$connect();
        } catch {}
        await new Promise(res => setTimeout(res, 200 * attempt));
        continue;
      }
      throw err;
    }
  }
}

export default prisma;
