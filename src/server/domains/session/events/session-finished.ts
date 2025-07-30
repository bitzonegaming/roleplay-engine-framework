import { SessionEndReason } from '@bitzonegaming/roleplay-engine-sdk';

import { SessionId } from '../models/session';

export interface RPSessionFinished {
  sessionId: SessionId;
  accountId?: string;
  characterId?: string;
  endReason: SessionEndReason;
  endReasonText?: string;
}
