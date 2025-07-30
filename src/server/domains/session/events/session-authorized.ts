import { SessionInfoAccount } from '@bitzonegaming/roleplay-engine-sdk';

import { SessionId } from '../models/session';

export interface RPSessionAuthorized {
  sessionId: SessionId;
  account: SessionInfoAccount;
}
