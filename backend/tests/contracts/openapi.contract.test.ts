import fs from 'fs';
import path from 'path';

const specPath = path.resolve(__dirname, '../../docs/openapi.json');

function loadSpec() {
  return JSON.parse(fs.readFileSync(specPath, 'utf8'));
}

describe('openapi contract', () => {
  it('exposes the current command and query routes', () => {
    const spec = loadSpec();

    expect(spec.openapi).toBe('3.0.3');
    expect(spec.paths['/api/commands/createModuleInstance'].post).toBeTruthy();
    expect(spec.paths['/api/commands/applySingleDayPeriodAction'].post).toBeTruthy();
    expect(spec.paths['/api/commands/recordPeriodDay'].post).toBeTruthy();
    expect(spec.paths['/api/commands/clearPeriodDay'].post).toBeTruthy();
    expect(spec.paths['/api/commands/recordPeriodRange'].post).toBeTruthy();
    expect(spec.paths['/api/commands/clearPeriodRange'].post).toBeTruthy();
    expect(spec.paths['/api/commands/recordDayDetails'].post).toBeTruthy();
    expect(spec.paths['/api/commands/recordDayNote'].post).toBeTruthy();
    expect(spec.paths['/api/commands/updateDefaultPeriodDuration'].post).toBeTruthy();
    expect(spec.paths['/api/commands/updateDefaultPredictionTerm'].post).toBeTruthy();
    expect(spec.paths['/api/commands/shareModuleInstance'].post).toBeTruthy();
    expect(spec.paths['/api/commands/revokeModuleAccess'].post).toBeTruthy();

    expect(spec.paths['/api/queries/getModuleHomeView'].get).toBeTruthy();
    expect(spec.paths['/api/queries/getSingleDayPeriodAction'].get).toBeTruthy();
    expect(spec.paths['/api/queries/getDayRecordDetail'].get).toBeTruthy();
    expect(spec.paths['/api/queries/getCalendarWindow'].get).toBeTruthy();
    expect(spec.paths['/api/queries/getPredictionSummary'].get).toBeTruthy();
    expect(spec.paths['/api/queries/getModuleAccessState'].get).toBeTruthy();
    expect(spec.paths['/api/queries/getModuleSettings'].get).toBeTruthy();
  });

  it('documents the key frontend integration request shapes', () => {
    const spec = loadSpec();
    const recordPeriodDaySchema = spec.paths['/api/commands/recordPeriodDay'].post.requestBody.content['application/json'].schema;
    const applySingleDayPeriodActionSchema =
      spec.paths['/api/commands/applySingleDayPeriodAction'].post.requestBody.content['application/json'].schema;
    const getSingleDayPeriodActionParameters =
      spec.paths['/api/queries/getSingleDayPeriodAction'].get.parameters;
    const getSingleDayPeriodActionResponse =
      spec.paths['/api/queries/getSingleDayPeriodAction'].get.responses['200'].content['application/json'].schema;
    const applySingleDayPeriodActionResponse =
      spec.paths['/api/commands/applySingleDayPeriodAction'].post.responses['200'].content['application/json'].schema;

    expect(recordPeriodDaySchema.required).toEqual(['moduleInstanceId', 'date']);
    expect(recordPeriodDaySchema.properties.painLevel).toBeUndefined();
    expect(recordPeriodDaySchema.properties.flowLevel).toBeUndefined();
    expect(recordPeriodDaySchema.properties.colorLevel).toBeUndefined();
    expect(recordPeriodDaySchema.properties.note).toBeUndefined();
    expect(getSingleDayPeriodActionParameters.map((item: { name: string }) => item.name)).toEqual([
      'x-wx-openid',
      'moduleInstanceId',
      'date',
    ]);
    expect(applySingleDayPeriodActionSchema.required).toEqual(['moduleInstanceId', 'selectedDate', 'action']);
    expect(applySingleDayPeriodActionSchema.properties.moduleInstanceId.type).toBe('string');
    expect(applySingleDayPeriodActionSchema.properties.selectedDate.format).toBe('date');
    expect(applySingleDayPeriodActionSchema.properties.action.enum).toEqual([
      'start',
      'revoke-start',
      'end-here',
      'noop',
    ]);
    expect(applySingleDayPeriodActionSchema.properties.confirmed.type).toBe('boolean');
    expect(getSingleDayPeriodActionResponse.properties.role.enum).toEqual([
      'not-period',
      'start',
      'in-progress',
      'end',
    ]);
    expect(getSingleDayPeriodActionResponse.properties.chip.properties.text.type).toBe('string');
    expect(getSingleDayPeriodActionResponse.properties.chip.properties.selected.type).toBe('boolean');
    expect(getSingleDayPeriodActionResponse.properties.resolvedAction.properties.action.enum).toEqual([
      'start',
      'revoke-start',
      'end-here',
      'noop',
    ]);
    expect(getSingleDayPeriodActionResponse.properties.resolvedAction.properties.prompt.nullable).toBe(true);
    expect(getSingleDayPeriodActionResponse.properties.resolvedAction.properties.effect.properties.bridgeType.enum).toEqual([
      'none',
      'forward',
      'backward',
      'both',
    ]);
    expect(applySingleDayPeriodActionResponse.properties.confirmationRequired.type).toBe('boolean');
    expect(applySingleDayPeriodActionResponse.properties.effect.nullable).toBe(true);
    expect(applySingleDayPeriodActionResponse.properties.effectPreview.nullable).toBe(true);
    expect(spec.paths['/api/commands/recordPeriodRange'].post.requestBody.content['application/json'].schema.required).toEqual(['moduleInstanceId', 'startDate', 'endDate']);
    expect(spec.paths['/api/commands/clearPeriodRange'].post.requestBody.content['application/json'].schema.required).toEqual(['moduleInstanceId', 'startDate', 'endDate']);
    expect(spec.paths['/api/commands/recordDayDetails'].post.requestBody.content['application/json'].schema.properties.painLevel.nullable).toBe(true);
    expect(spec.paths['/api/commands/recordDayDetails'].post.requestBody.content['application/json'].schema.properties.flowLevel.nullable).toBe(true);
    expect(spec.paths['/api/commands/recordDayDetails'].post.requestBody.content['application/json'].schema.properties.colorLevel.nullable).toBe(true);
    expect(spec.paths['/api/commands/recordDayNote'].post.requestBody.content['application/json'].schema.properties.note.maxLength).toBe(500);
    expect(Object.keys(spec.paths['/api/commands/recordDayNote'].post.responses)).toEqual(expect.arrayContaining(['200', '400', '404']));
    expect(Object.keys(spec.paths['/api/commands/updateDefaultPeriodDuration'].post.responses)).toEqual(expect.arrayContaining(['200', '403']));
    expect(Object.keys(spec.paths['/api/commands/updateDefaultPredictionTerm'].post.responses)).toEqual(expect.arrayContaining(['200', '403']));
    expect(spec.paths['/api/queries/getCalendarWindow'].get.parameters.map((item: { name: string }) => item.name)).toEqual([
      'x-wx-openid',
      'moduleInstanceId',
      'profileId',
      'startDate',
      'endDate',
    ]);
    expect(spec.paths['/api/queries/getModuleSettings'].get.parameters.map((item: { name: string }) => item.name)).toEqual([
      'x-wx-openid',
      'moduleInstanceId',
    ]);
  });
});
