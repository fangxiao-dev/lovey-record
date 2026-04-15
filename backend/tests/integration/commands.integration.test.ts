import request from 'supertest';
import app from '../../src/app';
import { applySingleDayPeriodAction, clearPeriodRange, recordPeriodRange } from '../../src/services/dayRecord.service';
import { createModuleInstance } from '../../src/services/moduleInstance.service';
import { findOrCreateUser } from '../../src/services/auth.service';
import { updateDefaultPeriodDuration, updateDefaultPredictionTerm } from '../../src/services/moduleSettings.service';
import { recordDayDetails, recordDayNote, recordDayDetailsBatch } from '../../src/services/phase5.service';

jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/dayRecord.service');
jest.mock('../../src/services/moduleInstance.service');
jest.mock('../../src/services/moduleSettings.service');
jest.mock('../../src/services/phase5.service');

describe('Commands Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a module instance through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (createModuleInstance as jest.Mock).mockResolvedValue({
      moduleInstance: {
        id: 'module-1',
        moduleType: 'menstrual',
        ownerUserId: 'user-1',
        profileId: 'profile-1',
        sharingStatus: 'PRIVATE',
      },
      profile: { id: 'profile-1', ownerUserId: 'user-1' },
    });

    const response = await request(app)
      .post('/api/commands/createModuleInstance')
      .set('x-wx-openid', 'openid-1')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstance: {
          id: 'module-1',
          moduleType: 'menstrual',
          ownerUserId: 'user-1',
          profileId: 'profile-1',
          sharingStatus: 'PRIVATE',
        },
      },
      error: null,
    });
  });

  it('updates the default period duration through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (updateDefaultPeriodDuration as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      defaultPeriodDurationDays: 7,
      settingsChanged: true,
    });

    const response = await request(app)
      .post('/api/commands/updateDefaultPeriodDuration')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', defaultPeriodDurationDays: 7 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        defaultPeriodDurationDays: 7,
        settingsChanged: true,
      },
      affectedScopes: ['moduleOverview', 'prediction'],
      error: null,
    });
  });

  it('returns NOTE_TOO_LONG when recording an overlong note', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (recordDayNote as jest.Mock).mockRejectedValue(Object.assign(new Error('Note exceeds the allowed length.'), { code: 'NOTE_TOO_LONG', statusCode: 400 }));

    const response = await request(app)
      .post('/api/commands/recordDayNote')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', date: '2026-03-23', note: 'a'.repeat(501) });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      ok: false,
      data: null,
      error: {
        code: 'NOTE_TOO_LONG',
        message: 'Note exceeds the allowed length.',
      },
    });
  });

  it('forwards recordDayDetails through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (recordDayDetails as jest.Mock).mockResolvedValue({
      detailChanged: true,
      hasDeviation: true,
    });

    const response = await request(app)
      .post('/api/commands/recordDayDetails')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', date: '2026-03-16', painLevel: 2, flowLevel: null, colorLevel: null });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        detailChanged: true,
        hasDeviation: true,
      },
      affectedScopes: ['calendar', 'dayDetail', 'prediction'],
      error: null,
    });
  });

  it('forwards recordDayNote through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (recordDayNote as jest.Mock).mockResolvedValue({
      noteChanged: true,
    });

    const response = await request(app)
      .post('/api/commands/recordDayNote')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', date: '2026-03-16', note: 'late sleep' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        noteChanged: true,
      },
      affectedScopes: ['calendar', 'dayDetail', 'prediction'],
      error: null,
    });
  });

  it('forwards recordPeriodRange through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (recordPeriodRange as jest.Mock).mockResolvedValue({
      recordedDates: ['2026-03-16', '2026-03-17'],
    });

    const response = await request(app)
      .post('/api/commands/recordPeriodRange')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', startDate: '2026-03-16', endDate: '2026-03-17' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        recordedDates: ['2026-03-16', '2026-03-17'],
      },
      affectedScopes: ['calendar', 'dayDetail', 'prediction'],
      error: null,
    });
  });

  it('batch-records day details through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (recordDayDetailsBatch as jest.Mock).mockResolvedValue({ updatedCount: 3 });

    const response = await request(app)
      .post('/api/commands/recordDayDetailsBatch')
      .set('x-wx-openid', 'openid-1')
      .send({
        moduleInstanceId: 'module-1',
        dates: ['2026-04-01', '2026-04-02', '2026-04-03'],
        flowLevel: 2,
        painLevel: null,
        colorLevel: null,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: { updatedCount: 3 },
      affectedScopes: ['calendar', 'dayDetail', 'prediction'],
      error: null,
    });
    expect(recordDayDetailsBatch).toHaveBeenCalledWith({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      dates: ['2026-04-01', '2026-04-02', '2026-04-03'],
      flowLevel: 2,
      painLevel: null,
      colorLevel: null,
    });
  });

  it('forwards clearPeriodRange through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (clearPeriodRange as jest.Mock).mockResolvedValue({
      clearedDates: ['2026-03-16'],
    });

    const response = await request(app)
      .post('/api/commands/clearPeriodRange')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', startDate: '2026-03-16', endDate: '2026-03-17' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        clearedDates: ['2026-03-16'],
      },
      affectedScopes: ['calendar', 'dayDetail', 'prediction'],
      error: null,
    });
  });

  it('returns MODULE_ACCESS_DENIED when recordPeriodRange rejects', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (recordPeriodRange as jest.Mock).mockRejectedValue(
      Object.assign(new Error('MODULE_ACCESS_DENIED'), { code: 'MODULE_ACCESS_DENIED', statusCode: 403 }),
    );

    const response = await request(app)
      .post('/api/commands/recordPeriodRange')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', startDate: '2026-03-16', endDate: '2026-03-17' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      ok: false,
      data: null,
      error: {
        code: 'MODULE_ACCESS_DENIED',
        message: 'MODULE_ACCESS_DENIED',
      },
    });
  });

  it('returns MODULE_ACCESS_DENIED when a non-owner updates default period duration', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-2', openid: 'openid-2' });
    (updateDefaultPeriodDuration as jest.Mock).mockRejectedValue(Object.assign(new Error('MODULE_ACCESS_DENIED'), { code: 'MODULE_ACCESS_DENIED', statusCode: 403 }));

    const response = await request(app)
      .post('/api/commands/updateDefaultPeriodDuration')
      .set('x-wx-openid', 'openid-2')
      .send({ moduleInstanceId: 'module-1', defaultPeriodDurationDays: 7 });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      ok: false,
      data: null,
      error: {
        code: 'MODULE_ACCESS_DENIED',
        message: 'MODULE_ACCESS_DENIED',
      },
    });
  });

  it('updates the default prediction term through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (updateDefaultPredictionTerm as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      defaultPredictionTermDays: 29,
      settingsChanged: true,
    });

    const response = await request(app)
      .post('/api/commands/updateDefaultPredictionTerm')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', defaultPredictionTermDays: 29 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        defaultPredictionTermDays: 29,
        settingsChanged: true,
      },
      affectedScopes: ['moduleOverview', 'prediction'],
      error: null,
    });
  });

  it('returns confirmationRequired for an unconfirmed single-day bridge action', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (applySingleDayPeriodAction as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      selectedDate: '2026-03-22',
      appliedAction: null,
      confirmationRequired: true,
      prompt: {
        required: true,
        type: 'backward',
        message: '已在 03/24 标记了经期开始，要提前到 03/22 吗？',
        confirmLabel: '确认',
        cancelLabel: '取消',
      },
      effectPreview: {
        action: 'bridge-backward',
        bridgeType: 'backward',
        selectedDate: '2026-03-22',
        writeDates: ['2026-03-22', '2026-03-23', '2026-03-24'],
        clearDates: [],
        resultingSegment: {
          startDate: '2026-03-22',
          endDate: '2026-03-28',
        },
      },
    });

    const response = await request(app)
      .post('/api/commands/applySingleDayPeriodAction')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', selectedDate: '2026-03-22', action: 'start' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        selectedDate: '2026-03-22',
        appliedAction: null,
        confirmationRequired: true,
        prompt: {
          required: true,
          type: 'backward',
          message: '已在 03/24 标记了经期开始，要提前到 03/22 吗？',
          confirmLabel: '确认',
          cancelLabel: '取消',
        },
        effectPreview: {
          action: 'bridge-backward',
          bridgeType: 'backward',
          selectedDate: '2026-03-22',
          writeDates: ['2026-03-22', '2026-03-23', '2026-03-24'],
          clearDates: [],
          resultingSegment: {
            startDate: '2026-03-22',
            endDate: '2026-03-28',
          },
        },
      },
      affectedScopes: [],
      error: null,
    });
    expect(applySingleDayPeriodAction).toHaveBeenCalledWith({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      selectedDate: '2026-03-22',
      action: 'start',
      confirmed: undefined,
    });
  });

  it('forwards a confirmed single-day action through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (applySingleDayPeriodAction as jest.Mock).mockResolvedValue({
      moduleInstanceId: 'module-1',
      selectedDate: '2026-03-22',
      appliedAction: 'bridge-backward',
      confirmationRequired: false,
      effect: {
        action: 'bridge-backward',
        bridgeType: 'backward',
        selectedDate: '2026-03-22',
        writeDates: ['2026-03-22', '2026-03-23', '2026-03-24'],
        clearDates: [],
        resultingSegment: {
          startDate: '2026-03-22',
          endDate: '2026-03-28',
        },
      },
      recomputed: {
        segmentChanged: true,
        predictionChanged: true,
      },
    });

    const response = await request(app)
      .post('/api/commands/applySingleDayPeriodAction')
      .set('x-wx-openid', 'openid-1')
      .send({ moduleInstanceId: 'module-1', selectedDate: '2026-03-22', action: 'start', confirmed: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        moduleInstanceId: 'module-1',
        selectedDate: '2026-03-22',
        appliedAction: 'bridge-backward',
        confirmationRequired: false,
        effect: {
          action: 'bridge-backward',
          bridgeType: 'backward',
          selectedDate: '2026-03-22',
          writeDates: ['2026-03-22', '2026-03-23', '2026-03-24'],
          clearDates: [],
          resultingSegment: {
            startDate: '2026-03-22',
            endDate: '2026-03-28',
          },
        },
        recomputed: {
          segmentChanged: true,
          predictionChanged: true,
        },
      },
      affectedScopes: ['calendar', 'dayDetail', 'prediction'],
      error: null,
    });
  });
});
