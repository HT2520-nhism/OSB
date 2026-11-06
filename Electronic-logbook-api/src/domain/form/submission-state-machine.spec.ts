/**
 * PHASE 5.11 — Form Submission State Machine Tests
 */

import { FormSubmissionStatus } from '../../constants/enums/domain.enum';
import {
  assertFormStatusTransition,
  canTransitionFormStatus,
} from './submission-state-machine';

describe('FormSubmissionStateMachine', () => {
  it('allows draft → submitted → under_review → approved', () => {
    expect(
      canTransitionFormStatus(
        FormSubmissionStatus.DRAFT,
        FormSubmissionStatus.SUBMITTED,
      ),
    ).toBe(true);
    expect(
      canTransitionFormStatus(
        FormSubmissionStatus.SUBMITTED,
        FormSubmissionStatus.UNDER_REVIEW,
      ),
    ).toBe(true);
    expect(
      canTransitionFormStatus(
        FormSubmissionStatus.UNDER_REVIEW,
        FormSubmissionStatus.APPROVED,
      ),
    ).toBe(true);
  });

  it('allows rejection', () => {
    expect(
      canTransitionFormStatus(
        FormSubmissionStatus.UNDER_REVIEW,
        FormSubmissionStatus.REJECTED,
      ),
    ).toBe(true);
    expect(
      canTransitionFormStatus(
        FormSubmissionStatus.REJECTED,
        FormSubmissionStatus.DRAFT,
      ),
    ).toBe(true);
  });

  it('allows cancellation from draft/submitted only', () => {
    expect(
      canTransitionFormStatus(
        FormSubmissionStatus.DRAFT,
        FormSubmissionStatus.CANCELLED,
      ),
    ).toBe(true);
    expect(
      canTransitionFormStatus(
        FormSubmissionStatus.SUBMITTED,
        FormSubmissionStatus.CANCELLED,
      ),
    ).toBe(true);
    expect(
      canTransitionFormStatus(
        FormSubmissionStatus.UNDER_REVIEW,
        FormSubmissionStatus.CANCELLED,
      ),
    ).toBe(false);
  });

  it('rejects illegal transitions', () => {
    expect(() =>
      assertFormStatusTransition(
        FormSubmissionStatus.APPROVED,
        FormSubmissionStatus.DRAFT,
      ),
    ).toThrow();
    expect(() =>
      assertFormStatusTransition(
        FormSubmissionStatus.APPROVED,
        FormSubmissionStatus.REJECTED,
      ),
    ).toThrow();
    expect(() =>
      assertFormStatusTransition(
        FormSubmissionStatus.CANCELLED,
        FormSubmissionStatus.SUBMITTED,
      ),
    ).toThrow();
  });
});
