import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/db/prisma';

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

describe('non-period recording integration', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const openid = `itest-non-period-openid-${suffix}`;
  const userId = `itest-non-period-user-${suffix}`;
  const profileId = `itest-non-period-profile-${suffix}`;
  const moduleInstanceId = `itest-non-period-module-${suffix}`;

  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: userId,
        openid,
      },
    });

    await prisma.profile.create({
      data: {
        id: profileId,
        ownerUserId: userId,
        displayName: 'Integration Test Owner',
      },
    });

    await prisma.moduleInstance.create({
      data: {
        id: moduleInstanceId,
        moduleType: 'menstrual',
        ownerUserId: userId,
        profileId,
        sharingStatus: 'PRIVATE',
      },
    });

    await prisma.moduleSettings.create({
      data: {
        moduleInstanceId,
        defaultPeriodDurationDays: 6,
      },
    });
  });

  afterAll(async () => {
    await prisma.moduleInstance.delete({
      where: { id: moduleInstanceId },
    });
    await prisma.profile.delete({
      where: { id: profileId },
    });
    await prisma.user.delete({
      where: { id: userId },
    });
    await prisma.$disconnect();
  });

  it('creates an explicit non-period day record when details are posted on an empty day', async () => {
    const response = await request(app)
      .post('/api/commands/recordDayDetails')
      .set('x-wx-openid', openid)
      .send({
        moduleInstanceId,
        date: '2026-04-10',
        painLevel: 2,
        flowLevel: null,
        colorLevel: 4,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        detailChanged: true,
        isDetailRecorded: true,
      },
      error: null,
    });

    const persisted = await prisma.dayRecord.findUnique({
      where: {
        moduleInstanceId_profileId_date: {
          moduleInstanceId,
          profileId,
          date: toDateOnly('2026-04-10'),
        },
      },
    });

    expect(persisted).toMatchObject({
      moduleInstanceId,
      profileId,
      isPeriod: false,
      painLevel: 2,
      flowLevel: null,
      colorLevel: 4,
      note: null,
      source: 'MANUAL',
    });

    const detailResponse = await request(app)
      .get('/api/queries/getDayRecordDetail')
      .set('x-wx-openid', openid)
      .query({
        moduleInstanceId,
        profileId,
        date: '2026-04-10',
      });

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId,
        profileId,
        dayRecord: {
          date: '2026-04-10',
          isPeriod: false,
          painLevel: 2,
          flowLevel: null,
          colorLevel: 4,
          note: null,
          source: 'manual',
          isExplicit: true,
          isDetailRecorded: true,
        },
      },
      error: null,
    });
  });

  it('creates an explicit non-period day record when a note is posted on an empty day', async () => {
    const response = await request(app)
      .post('/api/commands/recordDayNote')
      .set('x-wx-openid', openid)
      .send({
        moduleInstanceId,
        date: '2026-04-11',
        note: 'late sleep',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        noteChanged: true,
      },
      error: null,
    });

    const persisted = await prisma.dayRecord.findUnique({
      where: {
        moduleInstanceId_profileId_date: {
          moduleInstanceId,
          profileId,
          date: toDateOnly('2026-04-11'),
        },
      },
    });

    expect(persisted).toMatchObject({
      moduleInstanceId,
      profileId,
      isPeriod: false,
      painLevel: null,
      flowLevel: null,
      colorLevel: null,
      note: 'late sleep',
      source: 'MANUAL',
    });

    const detailResponse = await request(app)
      .get('/api/queries/getDayRecordDetail')
      .set('x-wx-openid', openid)
      .query({
        moduleInstanceId,
        profileId,
        date: '2026-04-11',
      });

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId,
        profileId,
        dayRecord: {
          date: '2026-04-11',
          isPeriod: false,
          painLevel: null,
          flowLevel: null,
          colorLevel: null,
          note: 'late sleep',
          source: 'manual',
          isExplicit: true,
          isDetailRecorded: false,
        },
      },
      error: null,
    });
  });
});
