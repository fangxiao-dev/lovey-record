import prisma from '../../src/db/prisma';
import { ensureModuleSettings, getDefaultPeriodDurationDays, updateDefaultPeriodDuration } from '../../src/services/moduleSettings.service';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    moduleSettings: {
      upsert: jest.fn(),
    },
  },
}));

describe('moduleSettings.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the default period duration constant', () => {
    expect(getDefaultPeriodDurationDays()).toBe(6);
  });

  it('creates default settings when missing', async () => {
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      defaultPeriodDurationDays: 6,
    });

    await ensureModuleSettings('module-1');

    expect(prisma.moduleSettings.upsert).toHaveBeenCalledWith({
      where: { moduleInstanceId: 'module-1' },
      create: { moduleInstanceId: 'module-1', defaultPeriodDurationDays: 6 },
      update: {},
    });
  });

  it('updates the default period duration', async () => {
    (prisma.moduleSettings.upsert as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      defaultPeriodDurationDays: 7,
    });

    const result = await updateDefaultPeriodDuration('module-1', 7);

    expect(result).toEqual({
      moduleInstanceId: 'module-1',
      defaultPeriodDurationDays: 7,
      settingsChanged: true,
    });
    expect(prisma.moduleSettings.upsert).toHaveBeenCalledWith({
      where: { moduleInstanceId: 'module-1' },
      create: { moduleInstanceId: 'module-1', defaultPeriodDurationDays: 7 },
      update: { defaultPeriodDurationDays: 7 },
    });
  });
});
