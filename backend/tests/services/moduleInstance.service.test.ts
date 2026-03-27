import prisma from '../../src/db/prisma';
import { createModuleInstance } from '../../src/services/moduleInstance.service';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    moduleInstance: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    moduleAccess: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('moduleInstance.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a menstrual module instance, profile, and owner access for a first-time user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (prisma.profile.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.profile.create as jest.Mock).mockResolvedValue({ id: 'profile-1', ownerUserId: 'user-1' });
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.moduleInstance.create as jest.Mock).mockResolvedValue({
      id: 'module-1',
      moduleType: 'menstrual',
      ownerUserId: 'user-1',
      profileId: 'profile-1',
      sharingStatus: 'PRIVATE',
    });
    (prisma.moduleAccess.create as jest.Mock).mockResolvedValue({
      id: 'access-1',
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      role: 'OWNER',
    });

    const result = await createModuleInstance({ id: 'user-1', openid: 'openid-1' });

    expect(result.moduleInstance.id).toBe('module-1');
    expect(prisma.profile.create).toHaveBeenCalledWith({
      data: { ownerUserId: 'user-1' },
    });
    expect(prisma.moduleInstance.create).toHaveBeenCalledWith({
      data: {
        moduleType: 'menstrual',
        ownerUserId: 'user-1',
        profileId: 'profile-1',
      },
    });
    expect(prisma.moduleAccess.create).toHaveBeenCalledWith({
      data: {
        moduleInstanceId: 'module-1',
        userId: 'user-1',
        role: 'OWNER',
      },
    });
  });

  it('rejects creating a second module instance for the same owner', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1',
      ownerUserId: 'user-1',
    });

    await expect(createModuleInstance({ id: 'user-1', openid: 'openid-1' })).rejects.toMatchObject({
      code: 'MODULE_INSTANCE_EXISTS',
    });
  });
});
