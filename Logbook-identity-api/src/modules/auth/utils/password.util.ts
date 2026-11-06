import * as crypto from 'crypto';

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghjkmnpqrstuvwxyz';
const NUMBERS = '23456789';
const ALL_CHARS = UPPERCASE + LOWERCASE + NUMBERS;

export interface GeneratedPassword {
  plaintext: string;
  hash: string;
}

export function generateSecurePassword(length: number = 12): GeneratedPassword {
  const bytes = crypto.randomBytes(length);

  let password = '';

  password += UPPERCASE[crypto.randomInt(UPPERCASE.length)];
  password += LOWERCASE[crypto.randomInt(LOWERCASE.length)];
  password += NUMBERS[crypto.randomInt(NUMBERS.length)];

  for (let i = 3; i < length; i++) {
    password += ALL_CHARS[crypto.randomInt(ALL_CHARS.length)];
  }

  const shuffled = password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');

  return { plaintext: shuffled, hash: '' };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('base64url');
}

export function generateDeviceId(): string {
  return crypto.randomUUID();
}
