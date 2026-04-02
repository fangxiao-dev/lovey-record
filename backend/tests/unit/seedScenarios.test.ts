import { DEFAULT_PERIOD_DURATION_DAYS, DEFAULT_PREDICTION_TERM_DAYS } from '../../src/domain/menstrualDefaults';
import { buildFrontendIntegrationSeedScenarios } from '../../src/testing/seedScenarios';

describe('seedScenarios', () => {
  it('builds deterministic frontend integration scenarios', () => {
    const first = buildFrontendIntegrationSeedScenarios();
    const second = buildFrontendIntegrationSeedScenarios();

    expect(first).toEqual(second);
    expect(first.map((scenario) => scenario.name)).toEqual([
      'noRecordModule',
      'activePeriodHomeView',
      'predictedNextPeriod',
      'dayDetailRecorded',
      'sharedModuleAccess',
    ]);
  });

  it('covers the documented integration scenarios with the expected minimum shapes', () => {
    const scenarios = buildFrontendIntegrationSeedScenarios();
    const byName = Object.fromEntries(scenarios.map((scenario) => [scenario.name, scenario]));

    expect(byName.noRecordModule.dayRecords).toHaveLength(0);
    expect(byName.noRecordModule.derivedCycles).toHaveLength(0);
    expect(byName.noRecordModule.partnerUsers).toHaveLength(0);
    expect(byName.noRecordModule.moduleSettings.defaultPeriodDurationDays).toBe(DEFAULT_PERIOD_DURATION_DAYS);
    expect(byName.noRecordModule.moduleSettings.defaultPredictionTermDays).toBe(DEFAULT_PREDICTION_TERM_DAYS);

    expect(byName.activePeriodHomeView.dayRecords).toHaveLength(5);
    expect(byName.activePeriodHomeView.derivedCycles).toHaveLength(1);
    expect(byName.activePeriodHomeView.prediction).toBeDefined();

    expect(byName.predictedNextPeriod.dayRecords).toHaveLength(0);
    expect(byName.predictedNextPeriod.derivedCycles).toHaveLength(2);
    expect(byName.predictedNextPeriod.prediction?.predictedStartDate).toBe('2026-03-14');

    expect(byName.dayDetailRecorded.dayRecords).toHaveLength(1);
    expect(byName.dayDetailRecorded.dayRecords[0].note).toBe('rough day with cramps');

    expect(byName.sharedModuleAccess.partnerUsers).toHaveLength(1);
    expect(byName.sharedModuleAccess.moduleAccesses).toHaveLength(2);
    expect(byName.sharedModuleAccess.moduleInstance.sharingStatus).toBe('SHARED');
  });
});
