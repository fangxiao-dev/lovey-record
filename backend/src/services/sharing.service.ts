import crypto from 'crypto';
import prisma from '../db/prisma';

function createAccessError() {
  return Object.assign(new Error('MODULE_ACCESS_DENIED'), { code: 'MODULE_ACCESS_DENIED', statusCode: 403 });
}

function createSharingError(code: string, message: string, statusCode = 400) {
  return Object.assign(new Error(message), { code, statusCode });
}

async function requireOwner(moduleInstanceId: string, userId: string) {
  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: { id: moduleInstanceId, ownerUserId: userId },
  });
  if (!moduleInstance) throw createAccessError();
  return moduleInstance;
}

export async function createInviteToken(input: { moduleInstanceId: string; userId: string }) {
  await requireOwner(input.moduleInstanceId, input.userId);
  const now = new Date();
  const existing = await prisma.inviteToken.findFirst({
    where: { moduleInstanceId: input.moduleInstanceId, usedAt: null, expiresAt: { gt: now } },
  });
  if (existing) return { token: existing.token, expiresAt: existing.expiresAt.toISOString() };
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const created = await prisma.inviteToken.create({
    data: { token, moduleInstanceId: input.moduleInstanceId, createdByUserId: input.userId, expiresAt },
  });
  return { token: created.token, expiresAt: created.expiresAt.toISOString() };
}

export async function validateInviteToken(input: { token: string; userId: string }) {
  const record = await prisma.inviteToken.findFirst({ where: { token: input.token } });
  if (!record) throw createSharingError('INVALID_TOKEN', 'Invite token not found', 404);
  if (record.usedAt) throw createSharingError('TOKEN_ALREADY_USED', 'This invite has already been used');
  if (record.expiresAt < new Date()) throw createSharingError('TOKEN_EXPIRED', 'This invite has expired');
  const moduleInstance = await prisma.moduleInstance.findFirst({ where: { id: record.moduleInstanceId } });
  if (moduleInstance!.ownerUserId === input.userId) throw createSharingError('IS_OWNER', 'You are the owner of this module');
  const existingAccess = await prisma.moduleAccess.findFirst({
    where: { moduleInstanceId: record.moduleInstanceId, userId: input.userId, accessStatus: 'ACTIVE' },
  });
  if (existingAccess) throw createSharingError('ALREADY_MEMBER', 'You are already a member of this module');
  return {
    moduleInstanceId: record.moduleInstanceId,
    moduleType: moduleInstance!.moduleType,
    accessRole: 'VIEWER' as const,
    expiresAt: record.expiresAt.toISOString(),
  };
}

export async function acceptInvite(input: { token: string; userId: string }) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.inviteToken.findFirst({ where: { token: input.token } });
    if (!record) throw createSharingError('INVALID_TOKEN', 'Invite token not found', 404);
    if (record.usedAt) throw createSharingError('TOKEN_ALREADY_USED', 'This invite has already been used');
    if (record.expiresAt < new Date()) throw createSharingError('TOKEN_EXPIRED', 'This invite has expired');
    await tx.moduleAccess.create({
      data: { moduleInstanceId: record.moduleInstanceId, userId: input.userId, role: 'VIEWER', accessStatus: 'ACTIVE' },
    });
    await tx.inviteToken.update({
      where: { token: input.token },
      data: { usedAt: new Date(), usedByUserId: input.userId },
    });
    await tx.moduleInstance.update({
      where: { id: record.moduleInstanceId },
      data: { sharingStatus: 'SHARED' },
    });
    return { moduleInstanceId: record.moduleInstanceId, accessRole: 'VIEWER' as const };
  });
}

export async function leaveModule(input: { moduleInstanceId: string; userId: string }) {
  const access = await prisma.moduleAccess.findFirst({
    where: { moduleInstanceId: input.moduleInstanceId, userId: input.userId, accessStatus: 'ACTIVE' },
  });
  if (!access) throw createAccessError();
  if (access.role === 'OWNER') throw createAccessError();
  await prisma.moduleAccess.update({
    where: { id: access.id },
    data: { accessStatus: 'REVOKED', revokedAt: new Date() },
  });
  const remaining = await prisma.moduleAccess.findMany({
    where: { moduleInstanceId: input.moduleInstanceId, accessStatus: 'ACTIVE', NOT: { role: 'OWNER' } },
  });
  if (remaining.length === 0) {
    await prisma.moduleInstance.update({
      where: { id: input.moduleInstanceId },
      data: { sharingStatus: 'PRIVATE' },
    });
  }
  return { moduleInstanceId: input.moduleInstanceId };
}

function lower(s: string) {
  return s.toLowerCase();
}

export async function getModuleMembers(input: { moduleInstanceId: string; userId: string }) {
  const moduleInstance = await prisma.moduleInstance.findFirst({
    where: {
      id: input.moduleInstanceId,
      OR: [
        { ownerUserId: input.userId },
        { accesses: { some: { userId: input.userId, accessStatus: 'ACTIVE' } } },
      ],
    },
  });
  if (!moduleInstance) throw createAccessError();
  const accesses = await prisma.moduleAccess.findMany({
    where: { moduleInstanceId: input.moduleInstanceId, accessStatus: 'ACTIVE' },
    orderBy: { grantedAt: 'asc' },
  });
  const ownerRow = { userId: moduleInstance.ownerUserId, role: 'owner', accessStatus: 'active', grantedAt: null };
  const partnerRows = accesses.map((a) => ({
    userId: a.userId,
    role: lower(a.role),
    accessStatus: lower(a.accessStatus),
    grantedAt: a.grantedAt.toISOString(),
  }));
  return { members: [ownerRow, ...partnerRows.filter((r) => r.userId !== moduleInstance.ownerUserId)] };
}
