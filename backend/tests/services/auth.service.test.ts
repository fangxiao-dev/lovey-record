import { findOrCreateUser } from '../../src/services/auth.service';
import prisma from '../../src/db/prisma';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateUser', () => {
    it('should return existing user when found by openid', async () => {
      const existingUser = { id: 'user-1', openid: 'test-openid' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const result = await findOrCreateUser('test-openid');

      expect(result).toEqual(existingUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { openid: 'test-openid' },
      });
    });

    it('should create new user when not found', async () => {
      const newUser = { id: 'user-2', openid: 'new-openid' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(newUser);

      const result = await findOrCreateUser('new-openid');

      expect(result).toEqual(newUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { openid: 'new-openid' },
      });
    });

    it('should retry transient database errors before succeeding', async () => {
      const restoreSetTimeout = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation(((callback: (...args: any[]) => void, _ms?: number, ...args: any[]) => {
          callback(...args);
          return 0 as unknown as NodeJS.Timeout;
        }) as typeof setTimeout);

      const createdUser = { id: 'user-3', openid: 'retry-openid' };
      (prisma.user.findUnique as jest.Mock)
        .mockRejectedValueOnce({ code: 'P1001' })
        .mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await findOrCreateUser('retry-openid');

      expect(result).toEqual(createdUser);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { openid: 'retry-openid' },
      });

      restoreSetTimeout.mockRestore();
    });

    it('should throw error if database operation fails', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(dbError);

      await expect(findOrCreateUser('test-openid')).rejects.toThrow('Database connection failed');
    });
  });
});
