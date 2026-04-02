import { DEFAULT_PERIOD_DURATION_DAYS } from '../../src/domain/menstrualDefaults';
import { resolveSingleDayPeriodAction } from '../../src/services/singleDayPeriodAction.service';

describe('singleDayPeriodAction.service', () => {
  it('returns a fresh start preview for a date outside all segments', () => {
    const result = resolveSingleDayPeriodAction({
      selectedDate: '2026-03-22',
      periodDates: [],
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
    });

    expect(result.role).toBe('not-period');
    expect(result.chip).toEqual({ text: '月经', selected: false });
    expect(result.resolvedAction.action).toBe('start');
    expect(result.resolvedAction.bridgeType).toBe('none');
    expect(result.resolvedAction.prompt).toBeNull();
    expect(result.resolvedAction.effect).toEqual({
      action: 'start',
      bridgeType: 'none',
      selectedDate: '2026-03-22',
      writeDates: ['2026-03-22', '2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26'],
      clearDates: [],
      resultingSegment: {
        startDate: '2026-03-22',
        endDate: '2026-03-26',
      },
    });
  });

  it('returns revoke-start for a selected segment start', () => {
    const result = resolveSingleDayPeriodAction({
      selectedDate: '2026-03-20',
      periodDates: ['2026-03-20', '2026-03-21', '2026-03-22'],
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
    });

    expect(result.role).toBe('start');
    expect(result.chip).toEqual({ text: '月经开始', selected: true });
    expect(result.resolvedAction.action).toBe('revoke-start');
    expect(result.resolvedAction.prompt).toBeNull();
    expect(result.resolvedAction.effect.writeDates).toEqual([]);
    expect(result.resolvedAction.effect.clearDates).toEqual(['2026-03-20', '2026-03-21', '2026-03-22']);
    expect(result.resolvedAction.effect.resultingSegment).toBeNull();
  });

  it('returns end-here for a selected in-progress day', () => {
    const result = resolveSingleDayPeriodAction({
      selectedDate: '2026-03-22',
      periodDates: ['2026-03-20', '2026-03-21', '2026-03-22', '2026-03-23', '2026-03-24'],
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
    });

    expect(result.role).toBe('in-progress');
    expect(result.chip).toEqual({ text: '月经结束', selected: true });
    expect(result.resolvedAction.action).toBe('end-here');
    expect(result.resolvedAction.prompt).toBeNull();
    expect(result.resolvedAction.effect).toEqual({
      action: 'end-here',
      bridgeType: 'none',
      selectedDate: '2026-03-22',
      writeDates: ['2026-03-22'],
      clearDates: ['2026-03-23', '2026-03-24'],
      resultingSegment: {
        startDate: '2026-03-20',
        endDate: '2026-03-22',
      },
    });
  });

  it('returns noop for a selected segment end', () => {
    const result = resolveSingleDayPeriodAction({
      selectedDate: '2026-03-24',
      periodDates: ['2026-03-20', '2026-03-21', '2026-03-22', '2026-03-23', '2026-03-24'],
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
    });

    expect(result.role).toBe('end');
    expect(result.chip).toEqual({ text: '月经结束', selected: true });
    expect(result.resolvedAction.action).toBe('noop');
    expect(result.resolvedAction.prompt).toBeNull();
    expect(result.resolvedAction.effect).toEqual({
      action: 'noop',
      bridgeType: 'none',
      selectedDate: '2026-03-24',
      writeDates: [],
      clearDates: [],
      resultingSegment: {
        startDate: '2026-03-20',
        endDate: '2026-03-24',
      },
    });
  });

  it('returns a forward-bridge prompt with the frozen copy', () => {
    const result = resolveSingleDayPeriodAction({
      selectedDate: '2026-03-23',
      periodDates: ['2026-03-20', '2026-03-21'],
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
    });

    expect(result.role).toBe('not-period');
    expect(result.chip).toEqual({ text: '月经', selected: false });
    expect(result.resolvedAction.action).toBe('start');
    expect(result.resolvedAction.bridgeType).toBe('forward');
    expect(result.resolvedAction.prompt).toEqual({
      required: true,
      type: 'forward',
      message: '把这段经期延长到 03/23？',
      confirmLabel: '确认',
      cancelLabel: '取消',
    });
    expect(result.resolvedAction.effect).toEqual({
      action: 'bridge-forward',
      bridgeType: 'forward',
      selectedDate: '2026-03-23',
      writeDates: ['2026-03-22', '2026-03-23'],
      clearDates: [],
      resultingSegment: {
        startDate: '2026-03-20',
        endDate: '2026-03-23',
      },
    });
  });

  it('returns a backward-bridge prompt with the frozen copy', () => {
    const result = resolveSingleDayPeriodAction({
      selectedDate: '2026-03-22',
      periodDates: ['2026-03-24', '2026-03-25', '2026-03-26', '2026-03-27', '2026-03-28'],
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
    });

    expect(result.role).toBe('not-period');
    expect(result.chip).toEqual({ text: '月经', selected: false });
    expect(result.resolvedAction.action).toBe('start');
    expect(result.resolvedAction.bridgeType).toBe('backward');
    expect(result.resolvedAction.prompt).toEqual({
      required: true,
      type: 'backward',
      message: '已在 03/24 标记了经期开始，要提前到 03/22 吗？',
      confirmLabel: '确认',
      cancelLabel: '取消',
    });
    expect(result.resolvedAction.effect).toEqual({
      action: 'bridge-backward',
      bridgeType: 'backward',
      selectedDate: '2026-03-22',
      writeDates: ['2026-03-22', '2026-03-23', '2026-03-24'],
      clearDates: [],
      resultingSegment: {
        startDate: '2026-03-22',
        endDate: '2026-03-28',
      },
    });
  });

  it('returns a two-sided bridge prompt with the frozen copy', () => {
    const result = resolveSingleDayPeriodAction({
      selectedDate: '2026-03-23',
      periodDates: ['2026-03-20', '2026-03-21', '2026-03-25', '2026-03-26'],
      defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
    });

    expect(result.role).toBe('not-period');
    expect(result.chip).toEqual({ text: '月经', selected: false });
    expect(result.resolvedAction.action).toBe('start');
    expect(result.resolvedAction.bridgeType).toBe('both');
    expect(result.resolvedAction.prompt).toEqual({
      required: true,
      type: 'both',
      message: '附近已有经期记录，是否合并？',
      confirmLabel: '确认',
      cancelLabel: '取消',
    });
    expect(result.resolvedAction.effect).toEqual({
      action: 'bridge-both',
      bridgeType: 'both',
      selectedDate: '2026-03-23',
      writeDates: ['2026-03-22', '2026-03-23', '2026-03-24', '2026-03-25'],
      clearDates: [],
      resultingSegment: {
        startDate: '2026-03-20',
        endDate: '2026-03-26',
      },
    });
  });
});
