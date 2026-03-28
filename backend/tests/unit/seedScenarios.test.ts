import { buildFrontendIntegrationSeedScenarios } from '../../src/testing/seedScenarios';

describe('seedScenarios', () => {
  it('builds deterministic frontend integration scenarios', () => {
    const first = buildFrontendIntegrationSeedScenarios();
    const second = buildFrontendIntegrationSeedScenarios();

    expect(first).toEqual(second);
    expect(first.map((scenario) => scenario.name)).toEqual([
      'emptyModule',
      'activePeriodHomeView',
      'predictedNextPeriod',
      'dayDetailDeviation',
      'sharedModuleAccess',
    ]);
  });

  it('covers the documented integration scenarios with the expected minimum shapes', () => {
    const scenarios = buildFrontendIntegrationSeedScenarios();
    const byName = Object.fromEntries(scenarios.map((scenario) => [scenario.name, scenario]));

    expect(byName.emptyModule.dayRecords).toHaveLength(0);
    expect(byName.emptyModule.derivedCycles).toHaveLength(0);
    expect(byName.emptyModule.partnerUsers).toHaveLength(0);
    expect(byName.emptyModule.moduleSettings.defaultPeriodDurationDays).toBe(6);

    expect(byName.activePeriodHomeView.dayRecords).toHaveLength(6);
    expect(byName.activePeriodHomeView.derivedCycles).toHaveLength(1);
    expect(byName.activePeriodHomeView.prediction).toBeDefined();

    expect(byName.predictedNextPeriod.dayRecords).toHaveLength(0);
    expect(byName.predictedNextPeriod.derivedCycles).toHaveLength(2);
    expect(byName.predictedNextPeriod.prediction?.predictedStartDate).toBe('2026-03-28');

    expect(byName.dayDetailDeviation.dayRecords).toHaveLength(1);
    expect(byName.dayDetailDeviation.dayRecords[0].note).toBe('rough day with cramps');

    expect(byName.sharedModuleAccess.partnerUsers).toHaveLength(1);
    expect(byName.sharedModuleAccess.moduleAccesses).toHaveLength(2);
    expect(byName.sharedModuleAccess.moduleInstance.sharingStatus).toBe('SHARED');
  });
});
