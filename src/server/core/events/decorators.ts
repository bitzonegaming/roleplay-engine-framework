import 'reflect-metadata';
import { RPServerEvents } from './events';

const HANDLERS = Symbol('RP_SERVER_EVENT_HANDLERS');

export function OnServer<
  Events extends RPServerEvents = RPServerEvents,
  K extends keyof Events = keyof Events,
>(event: K) {
  return function (target: object, propertyKey: string, _descriptor: PropertyDescriptor) {
    const ctor = target.constructor as unknown;
    const list: Array<{ method: string; event: keyof Events }> =
      Reflect.getOwnMetadata(HANDLERS, ctor as object) || [];
    list.push({ method: propertyKey, event });
    Reflect.defineMetadata(HANDLERS, list, ctor as object);
  };
}

export function getEventHandlers<Events extends RPServerEvents = RPServerEvents>(
  instance: Record<string, unknown>,
) {
  return Reflect.getOwnMetadata(HANDLERS, instance.constructor) as
    | Array<{ method: string; event: keyof Events }>
    | undefined;
}
