import { RPServerEvents } from '../core/events/events';
import { RPEventEmitter } from '../../core/bus/event-emitter';
import { NativeS2CEventsAdapter } from '../natives/server-to-client-events-adapter';

import { RPS2CSessionEventKeys, RPS2CSessionEvents } from './events/session';
import { RPS2CAccountEventKeys, RPS2CAccountEvents } from './events/account';
import { RPS2CAllEventKeys, RPS2CAllEvents } from './events/all';

export class RPS2CEventHandler {
  constructor(
    private readonly eventEmitter: RPEventEmitter<RPServerEvents>,
    private readonly nativeS2CEventsAdapter: NativeS2CEventsAdapter,
  ) {
    this.bindSessionEvents();
    this.bindAccountEvents();
    this.bindAllEvents();
  }

  private bindSessionEvents() {
    for (const eventName of RPS2CSessionEventKeys) {
      this.eventEmitter.on(eventName, (payload: RPS2CSessionEvents[typeof eventName]) => {
        this.nativeS2CEventsAdapter.emitSessionEvent(eventName, payload);
      });
    }
  }

  private bindAccountEvents() {
    for (const eventName of RPS2CAccountEventKeys) {
      this.eventEmitter.on(eventName, (payload: RPS2CAccountEvents[typeof eventName]) => {
        this.nativeS2CEventsAdapter.emitAccountEvent(eventName, payload);
      });
    }
  }

  private bindAllEvents() {
    for (const eventName of RPS2CAllEventKeys) {
      this.eventEmitter.on(eventName, (payload: RPS2CAllEvents[typeof eventName]) => {
        this.nativeS2CEventsAdapter.emitAll(eventName, payload);
      });
    }
  }
}
