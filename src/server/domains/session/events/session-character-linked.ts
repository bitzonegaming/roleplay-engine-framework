import { SessionInfoAccount, SessionInfoCharacter } from '@bitzonegaming/roleplay-engine-sdk';

import { SessionId } from '../models/session';

export interface RPSessionCharacterLinked {
  sessionId: SessionId;
  account: SessionInfoAccount;
  character: SessionInfoCharacter;
}
