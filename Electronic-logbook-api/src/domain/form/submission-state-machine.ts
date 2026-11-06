/**
 * Form Submission State Machine
 *
 * Allowed transitions:
 *   DRAFT -> SUBMITTED
 *   SUBMITTED -> UNDER_REVIEW
 *   UNDER_REVIEW -> APPROVED
 *   UNDER_REVIEW -> REJECTED
 *   REJECTED -> DRAFT        (allow re-open a rejected form for correction)
 *   DRAFT -> CANCELLED
 *   SUBMITTED -> CANCELLED
 *
 * Disallowed (sample):
 *   APPROVED -> DRAFT | REJECTED
 *   CANCELLED -> SUBMITTED | APPROVED | UNDER_REVIEW
 */

import { BadRequestException } from '@nestjs/common';

import { FormSubmissionStatus } from '../../constants/enums/domain.enum';

const ALLOWED: Readonly<
  Record<FormSubmissionStatus, ReadonlyArray<FormSubmissionStatus>>
> = {
  [FormSubmissionStatus.DRAFT]: [
    FormSubmissionStatus.SUBMITTED,
    FormSubmissionStatus.CANCELLED,
  ],
  [FormSubmissionStatus.SUBMITTED]: [
    FormSubmissionStatus.UNDER_REVIEW,
    FormSubmissionStatus.CANCELLED,
  ],
  [FormSubmissionStatus.UNDER_REVIEW]: [
    FormSubmissionStatus.APPROVED,
    FormSubmissionStatus.REJECTED,
  ],
  [FormSubmissionStatus.APPROVED]: [],
  [FormSubmissionStatus.REJECTED]: [FormSubmissionStatus.DRAFT],
  [FormSubmissionStatus.CANCELLED]: [],
};

export const TERMINAL_FORM_STATUSES: ReadonlyArray<FormSubmissionStatus> = [
  FormSubmissionStatus.APPROVED,
  FormSubmissionStatus.CANCELLED,
];

export function canTransitionFormStatus(
  from: FormSubmissionStatus | string | null | undefined,
  to: FormSubmissionStatus | string,
): boolean {
  if (!from) return false;
  const allowed = ALLOWED[from as FormSubmissionStatus];
  if (!allowed) return false;
  return allowed.includes(to as FormSubmissionStatus);
}

export function assertFormStatusTransition(
  from: FormSubmissionStatus | string | null | undefined,
  to: FormSubmissionStatus | string,
): void {
  if (!canTransitionFormStatus(from, to)) {
    throw new BadRequestException(
      `Invalid form status transition: ${String(from)} -> ${String(to)}`,
    );
  }
}
