import { createHmac } from 'crypto';

import { SessionInfoAccount, SessionInfoCharacter } from '@bitzonegaming/roleplay-engine-sdk';
import { v4 as uuidV4 } from 'uuid';

export type SessionId = string;

export function generateSessionId() {
  return uuidV4();
}

export function generateSessionTokenHash(sessionId: SessionId, sessionToken: string): string {
  return createHmac('sha256', sessionId).update(sessionToken, 'ascii').digest('hex');
}

export interface RPSession {
  id: SessionId;
  tokenHash: string;
  character?: SessionInfoCharacter;
  account?: SessionInfoAccount;
  hash?: string;
}
