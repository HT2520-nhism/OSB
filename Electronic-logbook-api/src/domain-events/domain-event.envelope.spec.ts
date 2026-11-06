import {
  DOMAIN_EVENT_VERSION,
  DomainEventType,
  isKnownEventType,
  OutboxStatus,
} from './domain-event.envelope';

describe('DomainEvent envelope', () => {
  it('exposes a stable canonical version', () => {
    expect(DOMAIN_EVENT_VERSION).toBe(1);
  });

  it('has PascalCase event names for every canonical event', () => {
    for (const name of Object.values(DomainEventType)) {
      expect(name).toMatch(/^[A-Z][A-Za-z0-9]+$/);
    }
  });

  it('recognises every canonical event name', () => {
    for (const name of Object.values(DomainEventType)) {
      expect(isKnownEventType(name)).toBe(true);
    }
    expect(isKnownEventType('NotAnEvent')).toBe(false);
  });

  it('defines the canonical outbox status vocabulary', () => {
    expect(Object.values(OutboxStatus)).toEqual([
      'pending',
      'in_flight',
      'published',
      'failed',
      'permanently_failed',
    ]);
  });
});
