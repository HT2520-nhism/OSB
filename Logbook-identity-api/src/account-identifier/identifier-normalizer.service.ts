import { Injectable } from '@nestjs/common';

import { IdentifierType } from '../constants/enums/identifier-type.enum';

@Injectable()
export class IdentifierNormalizer {
  normalize(type: IdentifierType, value: string): string {
    switch (type) {
      case IdentifierType.EMAIL:
        return this.normalizeEmail(value);
      case IdentifierType.PHONE:
        return this.normalizePhone(value);
      default:
        return value.trim();
    }
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  normalizePhone(phone: string): string {
    let normalized = phone.trim();

    normalized = normalized.replace(/[\s\-\.\(\)]/g, '');

    if (normalized.startsWith('0')) {
      normalized = '+84' + normalized.slice(1);
    }

    if (normalized.startsWith('84') && !normalized.startsWith('+84')) {
      normalized = '+84' + normalized.slice(2);
    }

    if (normalized.startsWith('+840') && normalized.length > 4) {
      normalized = '+84' + normalized.slice(4);
    }

    return normalized;
  }
}
