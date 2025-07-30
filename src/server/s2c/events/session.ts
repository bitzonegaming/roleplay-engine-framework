import { SessionId } from '../../domains/session/models/session';
import { RPServerEvents } from '../../core/events/events';

type MustHaveSessionId<T extends { sessionId: SessionId }> = T;

export const RPS2CSessionEventKeys = ['sessionFinished', 'sessionUpdated'] as const;

export type RPS2CSessionEventKeys = (typeof RPS2CSessionEventKeys)[number];

export type RPS2CSessionEvents = {
  [K in RPS2CSessionEventKeys]: MustHaveSessionId<RPServerEvents[K]>;
};
