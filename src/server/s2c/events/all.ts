import { RPServerEvents } from '../../core/events/events';

export const RPS2CAllEventKeys = ['accountUsernameChanged'] as const;

export type RPS2CAllEventKeys = (typeof RPS2CAllEventKeys)[number];

export type RPS2CAllEvents = {
  [K in RPS2CAllEventKeys]: RPServerEvents[K];
};
