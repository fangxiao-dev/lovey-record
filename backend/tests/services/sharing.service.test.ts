import prisma from '../../src/db/prisma';
import { createInviteToken, validateInviteToken, acceptInvite, leaveModule, getModuleMembers } from '../../src/services/sharing.service';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    moduleInstance: { findFirst: jest.fn(), update: jest.fn() },
    inviteToken: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    moduleAccess: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn({
      inviteToken: { findFirst: jest.fn(), update: jest.fn() },
      moduleAccess: { create: jest.fn() },
      moduleInstance: { update: jest.fn() },
    })),
  },
}));

describe('sharing.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createInviteToken', () => {
    it('creates a new token when none exists', async () => {
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'mod-1', ownerUserId: 'user-1' });
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.inviteToken.create as jest.Mock).mockResolvedValue({ token: 'abc123', expiresAt: new Date('2026-04-10T00:00:00Z') });
      const result = await createInviteToken({ moduleInstanceId: 'mod-1', userId: 'user-1' });
      expect(prisma.inviteToken.create).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
    });

    it('returns the existing unused token without creating a new one', async () => {
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'mod-1', ownerUserId: 'user-1' });
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({ token: 'existing-token', expiresAt: new Date('2026-04-10T00:00:00Z') });
      const result = await createInviteToken({ moduleInstanceId: 'mod-1', userId: 'user-1' });
      expect(prisma.inviteToken.create).not.toHaveBeenCalled();
      expect(result.token).toBe('existing-token');
    });

    it('throws MODULE_ACCESS_DENIED when caller is not the owner', async () => {
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(createInviteToken({ moduleInstanceId: 'mod-1', userId: 'wrong-user' }))
        .rejects.toMatchObject({ code: 'MODULE_ACCESS_DENIED' });
    });
  });

  describe('validateInviteToken', () => {
    it('returns module info when token is valid', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({ token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: null });
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'mod-1', moduleType: 'menstrual', ownerUserId: 'owner-1' });
      (prisma.moduleAccess.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await validateInviteToken({ token: 'tok', userId: 'user-2' });
      expect(result.moduleInstanceId).toBe('mod-1');
      expect(result.accessRole).toBe('VIEWER');
    });

    it('throws INVALID_TOKEN when token does not exist', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(validateInviteToken({ token: 'bad', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    });

    it('throws TOKEN_ALREADY_USED when usedAt is set', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({ token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: new Date() });
      await expect(validateInviteToken({ token: 'tok', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'TOKEN_ALREADY_USED' });
    });

    it('throws TOKEN_EXPIRED when expiresAt is in the past', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({ token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2000-01-01'), usedAt: null });
      await expect(validateInviteToken({ token: 'tok', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
    });

    it('throws IS_OWNER when caller owns the module', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({ token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: null });
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'mod-1', moduleType: 'menstrual', ownerUserId: 'owner-1' });
      (prisma.moduleAccess.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(validateInviteToken({ token: 'tok', userId: 'owner-1' }))
        .rejects.toMatchObject({ code: 'IS_OWNER' });
    });

    it('throws ALREADY_MEMBER when caller already has active access', async () => {
      (prisma.inviteToken.findFirst as jest.Mock).mockResolvedValue({ token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: null });
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'mod-1', moduleType: 'menstrual', ownerUserId: 'owner-1' });
      (prisma.moduleAccess.findFirst as jest.Mock).mockResolvedValue({ id: 'access-1' });
      await expect(validateInviteToken({ token: 'tok', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'ALREADY_MEMBER' });
    });
  });

  describe('acceptInvite', () => {
    it('creates a ModuleAccess with VIEWER role and marks token as used', async () => {
      const txInviteToken = { findFirst: jest.fn(), update: jest.fn() };
      const txModuleAccess = { create: jest.fn() };
      const txModuleInstance = { update: jest.fn() };
      (prisma.$transaction as jest.Mock).mockImplementation((fn: any) =>
        fn({ inviteToken: txInviteToken, moduleAccess: txModuleAccess, moduleInstance: txModuleInstance })
      );
      txInviteToken.findFirst.mockResolvedValue({ token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: null });
      txModuleAccess.create.mockResolvedValue({ id: 'access-1' });
      const result = await acceptInvite({ token: 'tok', userId: 'user-2' });
      expect(txModuleAccess.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ role: 'VIEWER', accessStatus: 'ACTIVE', userId: 'user-2' }),
      }));
      expect(txInviteToken.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ usedAt: expect.any(Date), usedByUserId: 'user-2' }),
      }));
      expect(result.accessRole).toBe('VIEWER');
    });

    it('throws INVALID_TOKEN when token not found inside transaction', async () => {
      const txInviteToken = { findFirst: jest.fn(), update: jest.fn() };
      (prisma.$transaction as jest.Mock).mockImplementation((fn: any) =>
        fn({ inviteToken: txInviteToken, moduleAccess: { create: jest.fn() }, moduleInstance: { update: jest.fn() } })
      );
      txInviteToken.findFirst.mockResolvedValue(null);
      await expect(acceptInvite({ token: 'tok', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    });

    it('throws TOKEN_ALREADY_USED when token is already used inside transaction', async () => {
      const txInviteToken = { findFirst: jest.fn(), update: jest.fn() };
      (prisma.$transaction as jest.Mock).mockImplementation((fn: any) =>
        fn({ inviteToken: txInviteToken, moduleAccess: { create: jest.fn() }, moduleInstance: { update: jest.fn() } })
      );
      txInviteToken.findFirst.mockResolvedValue({
        token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2099-01-01'), usedAt: new Date(),
      });
      await expect(acceptInvite({ token: 'tok', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'TOKEN_ALREADY_USED' });
    });

    it('throws TOKEN_EXPIRED when token is expired inside transaction', async () => {
      const txInviteToken = { findFirst: jest.fn(), update: jest.fn() };
      (prisma.$transaction as jest.Mock).mockImplementation((fn: any) =>
        fn({ inviteToken: txInviteToken, moduleAccess: { create: jest.fn() }, moduleInstance: { update: jest.fn() } })
      );
      txInviteToken.findFirst.mockResolvedValue({
        token: 'tok', moduleInstanceId: 'mod-1', expiresAt: new Date('2000-01-01'), usedAt: null,
      });
      await expect(acceptInvite({ token: 'tok', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
    });
  });

  describe('leaveModule', () => {
    it('revokes caller access and sets sharingStatus PRIVATE when no members remain', async () => {
      const txModuleAccess = { findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() };
      const txModuleInstance = { update: jest.fn() };
      (prisma.$transaction as jest.Mock).mockImplementation((fn: any) =>
        fn({ moduleAccess: txModuleAccess, moduleInstance: txModuleInstance })
      );
      txModuleAccess.findFirst.mockResolvedValue({ id: 'access-1', userId: 'user-2', role: 'VIEWER', moduleInstanceId: 'mod-1' });
      txModuleAccess.update.mockResolvedValue({});
      txModuleAccess.findMany.mockResolvedValue([]);
      txModuleInstance.update.mockResolvedValue({});
      const result = await leaveModule({ moduleInstanceId: 'mod-1', userId: 'user-2' });
      expect(txModuleAccess.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ accessStatus: 'REVOKED', revokedAt: expect.any(Date) }),
      }));
      expect(txModuleInstance.update).toHaveBeenCalledWith(expect.objectContaining({ data: { sharingStatus: 'PRIVATE' } }));
      expect(result.moduleInstanceId).toBe('mod-1');
    });

    it('throws MODULE_ACCESS_DENIED when caller is the owner', async () => {
      const txModuleAccess = { findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() };
      (prisma.$transaction as jest.Mock).mockImplementation((fn: any) =>
        fn({ moduleAccess: txModuleAccess, moduleInstance: { update: jest.fn() } })
      );
      txModuleAccess.findFirst.mockResolvedValue({ id: 'access-1', userId: 'owner-1', role: 'OWNER', moduleInstanceId: 'mod-1' });
      await expect(leaveModule({ moduleInstanceId: 'mod-1', userId: 'owner-1' }))
        .rejects.toMatchObject({ code: 'MODULE_ACCESS_DENIED' });
    });

    it('throws MODULE_ACCESS_DENIED when caller has no active access', async () => {
      const txModuleAccess = { findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() };
      (prisma.$transaction as jest.Mock).mockImplementation((fn: any) =>
        fn({ moduleAccess: txModuleAccess, moduleInstance: { update: jest.fn() } })
      );
      txModuleAccess.findFirst.mockResolvedValue(null);
      await expect(leaveModule({ moduleInstanceId: 'mod-1', userId: 'user-2' }))
        .rejects.toMatchObject({ code: 'MODULE_ACCESS_DENIED' });
    });
  });

  describe('getModuleMembers', () => {
    it('returns all active members with their roles', async () => {
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({ id: 'mod-1', ownerUserId: 'owner-1' });
      (prisma.moduleAccess.findMany as jest.Mock).mockResolvedValue([
        { userId: 'owner-1', role: 'OWNER', accessStatus: 'ACTIVE', grantedAt: new Date('2026-04-01') },
        { userId: 'user-2', role: 'VIEWER', accessStatus: 'ACTIVE', grantedAt: new Date('2026-04-09') },
      ]);
      const result = await getModuleMembers({ moduleInstanceId: 'mod-1', userId: 'owner-1' });
      expect(result.members).toHaveLength(2);
      expect(result.members[0].role).toBe('owner');
      expect(result.members[1].role).toBe('viewer');
    });

    it('throws MODULE_ACCESS_DENIED when caller is not a member', async () => {
      (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(getModuleMembers({ moduleInstanceId: 'mod-1', userId: 'outsider' }))
        .rejects.toMatchObject({ code: 'MODULE_ACCESS_DENIED' });
    });
  });
});
