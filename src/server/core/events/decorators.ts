import 'reflect-metadata';
import { RPServerEvents } from './events';

const HANDLERS = Symbol('RP_SERVER_EVENT_HANDLERS');

export function OnServer<K extends keyof RPServerEvents>(event: K) {
  return function <
    P extends `on${Capitalize<string & K>}`,
    T extends (payload: RPServerEvents[K]) => void | Promise<void>,
  >(target: object, propertyKey: P, _descriptor: TypedPropertyDescriptor<T>) {
    const ctor = target.constructor as unknown;
    const list: Array<{ method: string; event: keyof RPServerEvents }> =
      Reflect.getOwnMetadata(HANDLERS, ctor as object) || [];
    list.push({ method: propertyKey as string, event });
    Reflect.defineMetadata(HANDLERS, list, ctor as object);
  };
}

export function getEventHandlers(instance: Record<string, unknown>) {
  return Reflect.getOwnMetadata(HANDLERS, instance.constructor) as
    | Array<{ method: string; event: keyof RPServerEvents }>
    | undefined;
}
