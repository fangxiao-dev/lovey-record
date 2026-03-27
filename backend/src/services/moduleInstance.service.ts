import prisma from '../db/prisma';

export class ModuleInstanceError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function createModuleInstance(user: { id: string; openid: string }) {
  const existing = await prisma.moduleInstance.findFirst({
    where: {
      ownerUserId: user.id,
      moduleType: 'menstrual',
    },
  });

  if (existing) {
    throw new ModuleInstanceError('MODULE_INSTANCE_EXISTS', 'Module instance already exists for this owner');
  }

  const profile =
    (await prisma.profile.findUnique({
      where: { ownerUserId: user.id },
    })) ??
    (await prisma.profile.create({
      data: { ownerUserId: user.id },
    }));

  const moduleInstance = await prisma.moduleInstance.create({
    data: {
      moduleType: 'menstrual',
      ownerUserId: user.id,
      profileId: profile.id,
    },
  });

  await prisma.moduleAccess.create({
    data: {
      moduleInstanceId: moduleInstance.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  return { moduleInstance, profile };
}
