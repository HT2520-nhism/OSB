/**
 * PHASE 7 — Domain-event integration tests for FormSubmissionService.
 *
 * Verifies that valid state transitions produce domain events and
 * invalid transitions produce no committed event.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource as TypeOrmDataSource } from 'typeorm';

import { FormSubmissionService } from './form-submission.service';
import { OutboxService } from '../domain-events/outbox.service';
import { FormSubmission } from './form-submission.entity';
import { FormSubmissionData } from '../form-submission-data/form-submission-data.entity';
import { FormSubmissionVersion } from '../form-submission-version/form-submission-version.entity';
import { FormWorkflowHistory } from '../form-workflow-history/form-workflow-history.entity';
import { FormDefinition } from '../form-definition/form-definition.entity';
import { Vessel } from '../vessel/vessel.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FormSubmissionStatus } from '../constants/enums/domain.enum';

class FakeManager {
  stores: Record<string, Map<string, Record<string, unknown>>>;
  constructor(stores: Record<string, Map<string, Record<string, unknown>>>) {
    this.stores = stores;
  }
  create(
    entity: { name?: string } | string | undefined,
    value: Record<string, unknown>,
  ): Record<string, unknown> {
    return value;
  }
  async save(
    entity?: { name?: string } | string,
    value?: Record<string, unknown>,
  ) {
    if (value === undefined && entity && typeof entity === 'object') {
      value = entity as unknown as Record<string, unknown>;
      entity = undefined;
    }
    const name = typeof entity === 'string' ? entity : entity?.name ?? '';
    const id = (value?.id as string) ?? crypto.randomUUID();
    const stored = { ...(value ?? {}), id };
    const store = this.stores[name];
    if (store) store.set(id, stored);
    return stored;
  }
  async findOne(
    entity: { name?: string } | string,
    opts: { where: { id?: string; formSubmissionId?: string } },
  ) {
    const name = typeof entity === 'string' ? entity : entity?.name ?? '';
    const store = this.stores[name];
    if (!store) return null;
    const id = opts.where.id ?? opts.where.formSubmissionId;
    return store.get(String(id)) ?? null;
  }
}

class FakeDataSource {
  stores: Record<string, Map<string, Record<string, unknown>>>;
  constructor(stores: Record<string, Map<string, Record<string, unknown>>>) {
    this.stores = stores;
  }
  async transaction<T>(cb: (m: FakeManager) => Promise<T>): Promise<T> {
    return cb(new FakeManager(this.stores));
  }
}

function stores() {
  return {
    FormSubmission: new Map<string, Record<string, unknown>>(),
    FormSubmissionData: new Map<string, Record<string, unknown>>(),
    FormSubmissionVersion: new Map<string, Record<string, unknown>>(),
    FormWorkflowHistory: new Map<string, Record<string, unknown>>(),
    FormDefinition: new Map<string, Record<string, unknown>>(),
    Vessel: new Map<string, Record<string, unknown>>(),
    FishingTrip: new Map<string, Record<string, unknown>>(),
  };
}

function makeRepoStub(
  allStores: Record<string, Map<string, Record<string, unknown>>>,
) {
  return (entityName: string) => {
    const store = allStores[entityName];
    return {
      async findOne(opts: {
        where: { id?: string; formSubmissionId?: string };
      }) {
        if (!store) return null;
        const id = opts.where.id ?? opts.where.formSubmissionId;
        return store.get(String(id)) ?? null;
      },
      async save(_e: unknown, value: Record<string, unknown>) {
        if (!store) return value;
        const id = (value.id as string) ?? crypto.randomUUID();
        const stored = { ...value, id };
        store.set(id, stored);
        return stored;
      },
      async create(_e: unknown, value: Record<string, unknown>) {
        return value;
      },
    };
  };
}

describe('FormSubmissionService Phase 7 events', () => {
  let svc: FormSubmissionService;
  let outbox: {
    recorded: unknown[];
    failNext: boolean;
    failOnce: boolean;
  };
  let data: ReturnType<typeof stores>;
  let dataSource: FakeDataSource;

  async function buildModule() {
    data = stores();
    dataSource = new FakeDataSource(data);

    outbox = { recorded: [], failNext: false, failOnce: false };
    const outboxMock: Partial<OutboxService> = {
      record: jest.fn(async (_m: unknown, payload: unknown) => {
        if (outbox.failNext) throw new Error('outbox-fail');
        outbox.recorded.push(payload);
        return {} as never;
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FormSubmissionService,
        {
          provide: getRepositoryToken(FormSubmission),
          useValue: makeRepoStub(data)('FormSubmission'),
        },
        {
          provide: getRepositoryToken(FormSubmissionData),
          useValue: makeRepoStub(data)('FormSubmissionData'),
        },
        {
          provide: getRepositoryToken(FormSubmissionVersion),
          useValue: makeRepoStub(data)('FormSubmissionVersion'),
        },
        {
          provide: getRepositoryToken(FormWorkflowHistory),
          useValue: makeRepoStub(data)('FormWorkflowHistory'),
        },
        {
          provide: getRepositoryToken(FormDefinition),
          useValue: makeRepoStub(data)('FormDefinition'),
        },
        {
          provide: getRepositoryToken(Vessel),
          useValue: makeRepoStub(data)('Vessel'),
        },
        {
          provide: getRepositoryToken(FishingTrip),
          useValue: makeRepoStub(data)('FishingTrip'),
        },
        { provide: TypeOrmDataSource, useValue: dataSource },
        { provide: OutboxService, useValue: outboxMock },
      ],
    }).compile();

    return moduleRef.get(FormSubmissionService);
  }

  it('records FormSubmissionCreated on create', async () => {
    svc = await buildModule();
    data.FormDefinition.set('form-def-1', {
      id: 'form-def-1',
      isActive: true,
      formCode: 'M01',
    });
    data.Vessel.set('vessel-1', { id: 'vessel-1' });
    await svc.createForm(
      {
        formDefinitionId: 'form-def-1',
        vesselId: 'vessel-1',
        data: { purchasedQuantity: '100' },
      },
      { accountId: 'user-1' },
    );
    expect(outbox.recorded.length).toBe(1);
    expect((outbox.recorded[0] as { eventType: string }).eventType).toBe(
      'FormSubmissionCreated',
    );
  });

  it('rolls back the event if the transaction fails afterwards', async () => {
    svc = await buildModule();
    outbox.failNext = true;
    data.FormDefinition.set('form-def-2', {
      id: 'form-def-2',
      isActive: true,
      formCode: 'M01',
    });
    data.Vessel.set('vessel-2', { id: 'vessel-2' });
    await expect(
      svc.createForm(
        {
          formDefinitionId: 'form-def-2',
          vesselId: 'vessel-2',
          data: { purchasedQuantity: '10' },
        },
        { accountId: 'user-2' },
      ),
    ).rejects.toBeTruthy();
    expect(data.FormSubmission.size).toBe(0);
    expect(data.FormSubmissionData.size).toBe(0);
  });

  it('records a workflow event on a valid DRAFT→SUBMITTED transition', async () => {
    svc = await buildModule();
    data.FormSubmission.set('sub-1', {
      id: 'sub-1',
      formDefinitionId: 'f1',
      vesselId: 'v1',
      status: FormSubmissionStatus.DRAFT,
      version: 1,
      fishingTripId: null,
    });
    await svc.transition('sub-1', FormSubmissionStatus.SUBMITTED, {
      accountId: 'user-3',
    });
    const types = outbox.recorded.map(
      (e) => (e as { eventType: string }).eventType,
    );
    expect(types).toContain('FormSubmissionSubmitted');
    expect(types).toContain('FormWorkflowChanged');
  });

  it('records no committed event for invalid transition', async () => {
    svc = await buildModule();
    data.FormSubmission.set('sub-2', {
      id: 'sub-2',
      formDefinitionId: 'f1',
      vesselId: 'v1',
      status: FormSubmissionStatus.APPROVED,
      version: 1,
      fishingTripId: null,
    });
    await expect(
      svc.transition('sub-2', FormSubmissionStatus.SUBMITTED, {
        accountId: 'user-4',
      }),
    ).rejects.toBeTruthy();
    expect(outbox.recorded.length).toBe(0);
  });
});
