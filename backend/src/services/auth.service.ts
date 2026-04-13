import prisma from '../db/prisma';
import { withDatabaseRetry } from '../db/databaseRetry';

export async function findOrCreateUser(openid: string) {
  return withDatabaseRetry(async () => {
    const user = await prisma.user.findUnique({
      where: { openid },
    });

    if (user) {
      return user;
    }

    return prisma.user.create({
      data: { openid },
    });
  });
}
