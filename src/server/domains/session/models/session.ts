import { SessionInfoAccount, SessionInfoCharacter } from '@bitzonegaming/roleplay-engine-sdk';
import { v4 as uuidV4 } from 'uuid';

export type SessionId = string;

export function generateSessionId() {
  return uuidV4();
}

export interface RPSession {
  id: SessionId;
  tokenHash: string;
  character?: SessionInfoCharacter;
  account?: SessionInfoAccount;
  hash?: string;
}
