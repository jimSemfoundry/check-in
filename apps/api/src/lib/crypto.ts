import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export function generateSecret(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url');
}

export function hashSecret(secret: string, pepper: string): string {
  return createHmac('sha256', pepper).update(secret, 'utf8').digest('hex');
}

export function safeHashEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
