import { prisma } from "./prisma";

// Passou mais que isso sem sincronizar com sucesso = algo parou de funcionar
// (o cron roda 1x/dia; 30h da folga pro horario impreciso do plano Hobby).
export const STALE_AFTER_HOURS = 30;

export async function recordSyncSuccess() {
  const now = new Date();
  await prisma.syncStatus.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", lastAttemptAt: now, lastSuccessAt: now, lastError: null },
    update: { lastAttemptAt: now, lastSuccessAt: now, lastError: null },
  });
}

export async function recordSyncFailure(message: string) {
  await prisma.syncStatus.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", lastAttemptAt: new Date(), lastError: message.slice(0, 500) },
    update: { lastAttemptAt: new Date(), lastError: message.slice(0, 500) },
  });
}

export async function getSyncStatus() {
  return prisma.syncStatus.findUnique({ where: { id: "singleton" } });
}

export function hoursSince(date: Date | null | undefined, now = new Date()): number | null {
  if (!date) return null;
  return (now.getTime() - date.getTime()) / 36e5;
}
