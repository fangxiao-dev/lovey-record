import { DEFAULT_PERIOD_DURATION_DAYS, DEFAULT_PREDICTION_TERM_DAYS } from '../domain/menstrualDefaults';

export type SeedDayRecordSource = 'MANUAL' | 'AUTO_FILLED';
export type SeedSharingStatus = 'PRIVATE' | 'SHARED';
export type SeedAccessRole = 'OWNER' | 'PARTNER';
export type SeedAccessStatus = 'ACTIVE' | 'REVOKED';

export interface SeedUser {
  id: string;
  openid: string;
}

export interface SeedProfile {
  id: string;
  ownerUserId: string;
  displayName: string;
}

export interface SeedModuleInstance {
  id: string;
  moduleType: 'menstrual';
  ownerUserId: string;
  profileId: string;
  sharingStatus: SeedSharingStatus;
}

export interface SeedModuleAccess {
  moduleInstanceId: string;
  userId: string;
  role: SeedAccessRole;
  accessStatus: SeedAccessStatus;
}

export interface SeedModuleSettings {
  moduleInstanceId: string;
  defaultPeriodDurationDays: number;
  defaultPredictionTermDays: number;
}

export interface SeedDayRecord {
  id: string;
  moduleInstanceId: string;
  profileId: string;
  date: string;
  isPeriod: boolean;
  source: SeedDayRecordSource;
  painLevel: number | null;
  flowLevel: number | null;
  colorLevel: number | null;
  note: string | null;
}

export interface SeedDerivedCycle {
  id: string;
  moduleInstanceId: string;
  profileId: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  derivedFromDates: string[];
}

export interface SeedPrediction {
  id: string;
  moduleInstanceId: string;
  profileId: string;
  predictedStartDate: string;
  predictionWindowStart: string;
  predictionWindowEnd: string;
  basedOnCycleCount: number;
}

export interface SeedScenario {
  name: 'noRecordModule' | 'activePeriodHomeView' | 'predictedNextPeriod' | 'dayDetailRecorded' | 'sharedModuleAccess';
  ownerUser: SeedUser;
  partnerUsers: SeedUser[];
  profile: SeedProfile;
  moduleInstance: SeedModuleInstance;
  moduleAccesses: SeedModuleAccess[];
  moduleSettings: SeedModuleSettings;
  dayRecords: SeedDayRecord[];
  derivedCycles: SeedDerivedCycle[];
  prediction?: SeedPrediction;
}

function buildCycleDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  for (let current = start; current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    dates.push(current.toISOString().slice(0, 10));
  }

  return dates;
}

function createDayRecord(params: Omit<SeedDayRecord, 'id'> & { idSuffix: string }): SeedDayRecord {
  const { idSuffix, ...record } = params;
  return {
    id: `${record.moduleInstanceId}-day-${idSuffix}`,
    ...record,
  };
}

function createDerivedCycle(params: Omit<SeedDerivedCycle, 'id' | 'derivedFromDates'> & { idSuffix: string; derivedFromDates: string[] }): SeedDerivedCycle {
  const { idSuffix, derivedFromDates, ...cycle } = params;
  return {
    id: `${cycle.moduleInstanceId}-cycle-${idSuffix}`,
    ...cycle,
    derivedFromDates,
  };
}

function createPrediction(params: Omit<SeedPrediction, 'id'> & { idSuffix: string }): SeedPrediction {
  const { idSuffix, ...prediction } = params;
  return {
    id: `${prediction.moduleInstanceId}-prediction-${idSuffix}`,
    ...prediction,
  };
}

export function buildFrontendIntegrationSeedScenarios(): SeedScenario[] {
  return [
    {
      name: 'noRecordModule',
      ownerUser: {
        id: 'seed-empty-owner',
        openid: 'seed-empty-openid',
      },
      partnerUsers: [],
      profile: {
        id: 'seed-empty-profile',
        ownerUserId: 'seed-empty-owner',
        displayName: 'Empty Module Owner',
      },
      moduleInstance: {
        id: 'seed-empty-module',
        moduleType: 'menstrual',
        ownerUserId: 'seed-empty-owner',
        profileId: 'seed-empty-profile',
        sharingStatus: 'PRIVATE',
      },
      moduleAccesses: [
        {
          moduleInstanceId: 'seed-empty-module',
          userId: 'seed-empty-owner',
          role: 'OWNER',
          accessStatus: 'ACTIVE',
        },
      ],
      moduleSettings: {
        moduleInstanceId: 'seed-empty-module',
        defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
        defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
      },
      dayRecords: [],
      derivedCycles: [],
    },
    {
      name: 'activePeriodHomeView',
      ownerUser: {
        id: 'seed-home-owner',
        openid: 'seed-home-openid',
      },
      partnerUsers: [],
      profile: {
        id: 'seed-home-profile',
        ownerUserId: 'seed-home-owner',
        displayName: 'Active Home Owner',
      },
      moduleInstance: {
        id: 'seed-home-module',
        moduleType: 'menstrual',
        ownerUserId: 'seed-home-owner',
        profileId: 'seed-home-profile',
        sharingStatus: 'PRIVATE',
      },
      moduleAccesses: [
        {
          moduleInstanceId: 'seed-home-module',
          userId: 'seed-home-owner',
          role: 'OWNER',
          accessStatus: 'ACTIVE',
        },
      ],
      moduleSettings: {
        moduleInstanceId: 'seed-home-module',
        defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
        defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
      },
      dayRecords: [
        createDayRecord({
          idSuffix: 'start',
          moduleInstanceId: 'seed-home-module',
          profileId: 'seed-home-profile',
          date: '2026-03-26',
          isPeriod: true,
          source: 'MANUAL',
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
        }),
        createDayRecord({
          idSuffix: 'tail-1',
          moduleInstanceId: 'seed-home-module',
          profileId: 'seed-home-profile',
          date: '2026-03-27',
          isPeriod: true,
          source: 'AUTO_FILLED',
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
        }),
        createDayRecord({
          idSuffix: 'tail-2',
          moduleInstanceId: 'seed-home-module',
          profileId: 'seed-home-profile',
          date: '2026-03-28',
          isPeriod: true,
          source: 'AUTO_FILLED',
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
        }),
        createDayRecord({
          idSuffix: 'tail-3',
          moduleInstanceId: 'seed-home-module',
          profileId: 'seed-home-profile',
          date: '2026-03-29',
          isPeriod: true,
          source: 'AUTO_FILLED',
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
        }),
        createDayRecord({
          idSuffix: 'tail-4',
          moduleInstanceId: 'seed-home-module',
          profileId: 'seed-home-profile',
          date: '2026-03-30',
          isPeriod: true,
          source: 'AUTO_FILLED',
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
        }),
      ],
      derivedCycles: [
        createDerivedCycle({
          idSuffix: 'current',
          moduleInstanceId: 'seed-home-module',
          profileId: 'seed-home-profile',
          startDate: '2026-03-26',
          endDate: '2026-03-30',
          durationDays: 5,
          derivedFromDates: buildCycleDates('2026-03-26', '2026-03-30'),
        }),
      ],
      prediction: createPrediction({
        idSuffix: 'next',
        moduleInstanceId: 'seed-home-module',
        profileId: 'seed-home-profile',
        predictedStartDate: '2026-04-23',
        predictionWindowStart: '2026-04-21',
        predictionWindowEnd: '2026-04-25',
        basedOnCycleCount: 1,
      }),
    },
    {
      name: 'predictedNextPeriod',
      ownerUser: {
        id: 'seed-pred-owner',
        openid: 'seed-pred-openid',
      },
      partnerUsers: [],
      profile: {
        id: 'seed-pred-profile',
        ownerUserId: 'seed-pred-owner',
        displayName: 'Predicted Next Owner',
      },
      moduleInstance: {
        id: 'seed-pred-module',
        moduleType: 'menstrual',
        ownerUserId: 'seed-pred-owner',
        profileId: 'seed-pred-profile',
        sharingStatus: 'PRIVATE',
      },
      moduleAccesses: [
        {
          moduleInstanceId: 'seed-pred-module',
          userId: 'seed-pred-owner',
          role: 'OWNER',
          accessStatus: 'ACTIVE',
        },
      ],
      moduleSettings: {
        moduleInstanceId: 'seed-pred-module',
        defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
        defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
      },
      dayRecords: [],
      derivedCycles: [
        createDerivedCycle({
          idSuffix: 'jan',
          moduleInstanceId: 'seed-pred-module',
          profileId: 'seed-pred-profile',
          startDate: '2026-01-18',
          endDate: '2026-01-22',
          durationDays: 5,
          derivedFromDates: buildCycleDates('2026-01-18', '2026-01-22'),
        }),
        createDerivedCycle({
          idSuffix: 'feb',
          moduleInstanceId: 'seed-pred-module',
          profileId: 'seed-pred-profile',
          startDate: '2026-02-14',
          endDate: '2026-02-18',
          durationDays: 5,
          derivedFromDates: buildCycleDates('2026-02-14', '2026-02-18'),
        }),
      ],
      prediction: createPrediction({
        idSuffix: 'next',
        moduleInstanceId: 'seed-pred-module',
        profileId: 'seed-pred-profile',
        predictedStartDate: '2026-03-14',
        predictionWindowStart: '2026-03-12',
        predictionWindowEnd: '2026-03-16',
        basedOnCycleCount: 2,
      }),
    },
    {
      name: 'dayDetailRecorded',
      ownerUser: {
        id: 'seed-detail-owner',
        openid: 'seed-detail-openid',
      },
      partnerUsers: [],
      profile: {
        id: 'seed-detail-profile',
        ownerUserId: 'seed-detail-owner',
        displayName: 'Detail Recorded Owner',
      },
      moduleInstance: {
        id: 'seed-detail-module',
        moduleType: 'menstrual',
        ownerUserId: 'seed-detail-owner',
        profileId: 'seed-detail-profile',
        sharingStatus: 'PRIVATE',
      },
      moduleAccesses: [
        {
          moduleInstanceId: 'seed-detail-module',
          userId: 'seed-detail-owner',
          role: 'OWNER',
          accessStatus: 'ACTIVE',
        },
      ],
      moduleSettings: {
        moduleInstanceId: 'seed-detail-module',
        defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
        defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
      },
      dayRecords: [
        createDayRecord({
          idSuffix: 'deviation',
          moduleInstanceId: 'seed-detail-module',
          profileId: 'seed-detail-profile',
          date: '2026-03-27',
          isPeriod: true,
          source: 'MANUAL',
          painLevel: 4,
          flowLevel: 2,
          colorLevel: 5,
          note: 'rough day with cramps',
        }),
      ],
      derivedCycles: [],
    },
    {
      name: 'sharedModuleAccess',
      ownerUser: {
        id: 'seed-shared-owner',
        openid: 'seed-shared-openid',
      },
      partnerUsers: [
        {
          id: 'seed-shared-partner',
          openid: 'seed-shared-partner-openid',
        },
      ],
      profile: {
        id: 'seed-shared-profile',
        ownerUserId: 'seed-shared-owner',
        displayName: 'Shared Module Owner',
      },
      moduleInstance: {
        id: 'seed-shared-module',
        moduleType: 'menstrual',
        ownerUserId: 'seed-shared-owner',
        profileId: 'seed-shared-profile',
        sharingStatus: 'SHARED',
      },
      moduleAccesses: [
        {
          moduleInstanceId: 'seed-shared-module',
          userId: 'seed-shared-owner',
          role: 'OWNER',
          accessStatus: 'ACTIVE',
        },
        {
          moduleInstanceId: 'seed-shared-module',
          userId: 'seed-shared-partner',
          role: 'PARTNER',
          accessStatus: 'ACTIVE',
        },
      ],
      moduleSettings: {
        moduleInstanceId: 'seed-shared-module',
        defaultPeriodDurationDays: DEFAULT_PERIOD_DURATION_DAYS,
        defaultPredictionTermDays: DEFAULT_PREDICTION_TERM_DAYS,
      },
      dayRecords: [
        createDayRecord({
          idSuffix: 'start',
          moduleInstanceId: 'seed-shared-module',
          profileId: 'seed-shared-profile',
          date: '2026-03-25',
          isPeriod: true,
          source: 'MANUAL',
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
        }),
        createDayRecord({
          idSuffix: 'tail-1',
          moduleInstanceId: 'seed-shared-module',
          profileId: 'seed-shared-profile',
          date: '2026-03-26',
          isPeriod: true,
          source: 'AUTO_FILLED',
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
        }),
        createDayRecord({
          idSuffix: 'tail-2',
          moduleInstanceId: 'seed-shared-module',
          profileId: 'seed-shared-profile',
          date: '2026-03-27',
          isPeriod: true,
          source: 'AUTO_FILLED',
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
        }),
        createDayRecord({
          idSuffix: 'tail-3',
          moduleInstanceId: 'seed-shared-module',
          profileId: 'seed-shared-profile',
          date: '2026-03-28',
          isPeriod: true,
          source: 'AUTO_FILLED',
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
        }),
        createDayRecord({
          idSuffix: 'tail-4',
          moduleInstanceId: 'seed-shared-module',
          profileId: 'seed-shared-profile',
          date: '2026-03-29',
          isPeriod: true,
          source: 'AUTO_FILLED',
          painLevel: 3,
          flowLevel: 3,
          colorLevel: 3,
          note: null,
        }),
      ],
      derivedCycles: [
        createDerivedCycle({
          idSuffix: 'current',
          moduleInstanceId: 'seed-shared-module',
          profileId: 'seed-shared-profile',
          startDate: '2026-03-25',
          endDate: '2026-03-29',
          durationDays: 5,
          derivedFromDates: buildCycleDates('2026-03-25', '2026-03-29'),
        }),
      ],
      prediction: createPrediction({
        idSuffix: 'next',
        moduleInstanceId: 'seed-shared-module',
        profileId: 'seed-shared-profile',
        predictedStartDate: '2026-04-22',
        predictionWindowStart: '2026-04-20',
        predictionWindowEnd: '2026-04-24',
        basedOnCycleCount: 1,
      }),
    },
  ];
}
