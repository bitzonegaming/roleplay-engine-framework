import { SessionInfoAccount, SessionInfoCharacter } from '@bitzonegaming/roleplay-engine-sdk';

import { SessionId } from '../models/session';

export interface RPSessionUpdated {
  sessionId: SessionId;
  account?: SessionInfoAccount;
  character?: SessionInfoCharacter;
}
