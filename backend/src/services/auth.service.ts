import prisma from '../db/prisma';

export async function findOrCreateUser(openid: string) {
  const user = await prisma.user.findUnique({
    where: { openid },
  });

  if (user) {
    return user;
  }

  return prisma.user.create({
    data: { openid },
  });
}
