import { RPS2CAccountEvents } from '../s2c/events/account';
import { RPS2CSessionEvents } from '../s2c/events/session';
import { RPS2CAllEvents } from '../s2c/events/all';

export interface NativeS2CEventsAdapter {
  emitSessionEvent<K extends keyof RPS2CSessionEvents>(
    event: K,
    payload: RPS2CSessionEvents[K],
  ): void;

  emitAccountEvent<K extends keyof RPS2CAccountEvents>(
    event: K,
    payload: RPS2CAccountEvents[K],
  ): void;

  emitAll<K extends keyof RPS2CAllEvents>(event: K, payload: RPS2CAllEvents[K]): void;
}
