import { SessionEndReason } from '@bitzonegaming/roleplay-engine-sdk';

import { SessionId } from '../../domains/session/models/session';

export interface RPPlayerDisconnected {
  sessionId: SessionId;
  reason: SessionEndReason;
}
