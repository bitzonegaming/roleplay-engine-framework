import { EngineClient } from '@bitzonegaming/roleplay-engine-sdk';

import { RPEventEmitter } from '../../core/bus/event-emitter';
import { RPHookBus } from '../../core/bus/hook-bus';
import { RPLogger } from '../../core/logger';

import { RPServerEvents } from './events/events';
import { getEventHandlers } from './events/decorators';
import { RPServerHooks } from './hooks/hooks';
import { RPServerContext } from './context';

/**
 * Type definition for server event handler methods.
 * Maps event names to their corresponding handler functions.
 */
export type RPServerEventHandlerMethods = {
  [K in keyof RPServerEvents]?: (payload: RPServerEvents[K]) => void | Promise<void>;
};

/**
 * Constructor type for server services.
 * @template C - The server context type
 */
export type RPServerServiceCtor<C extends RPServerContext = RPServerContext> = new (
  ctx: C,
) => RPServerService<C>;

/**
 * Abstract base class for all server services in the Roleplay Engine.
 *
 * This class provides core functionality for services including:
 * - Event handling with automatic decorator binding
 * - Access to shared infrastructure (event emitter, hook bus, logger)
 * - Service and API resolution through the server context
 * - Lifecycle management with initialization support
 *
 * Services extend this class to implement domain-specific functionality
 * such as account management, session handling, world management, etc.
 *
 * @template C - The server context type (defaults to RPServerContext)
 *
 * @example
 * ```typescript
 * export class MyService extends RPServerService {
 *   public async init(): Promise<void> {
 *     // Initialize service-specific resources
 *     await super.init();
 *   }
 *
 *   @OnServer('playerConnecting')
 *   private async onPlayerConnecting(payload: RPPlayerConnecting) {
 *     // Handle player connection event
 *   }
 * }
 * ```
 *
 * @example With custom context
 * ```typescript
 * export class PlayerService extends RPServerService<GameServerContext> {
 *   // this.context is now typed as GameServerContext
 *   public getPlayer(playerId: string) {
 *     return this.context.players.get(playerId);
 *   }
 * }
 * ```
 */
export abstract class RPServerService<C extends RPServerContext = RPServerContext> {
  public readonly eventHandlers: RPServerEventHandlerMethods;

  protected readonly eventEmitter: RPEventEmitter<RPServerEvents>;
  protected readonly hookBus: RPHookBus<RPServerHooks>;
  protected readonly logger: RPLogger;

  [key: string]: unknown;

  /**
   * Creates a new service instance.
   *
   * Automatically sets up event handling by scanning for @OnServer decorators
   * and binding them to the event emitter.
   *
   * @param context - The server context providing shared infrastructure
   */
  public constructor(protected readonly context: C) {
    this.eventEmitter = context.eventEmitter;
    this.hookBus = context.hookBus;
    this.logger = context.logger;
    this.eventHandlers = this.bindEventEmitters(context.eventEmitter);
  }

  /**
   * Initializes the service. Override this method to perform service-specific initialization.
   *
   * This method is called during server startup after all services have been registered.
   * Use this to set up initial state, load configuration, or prepare resources.
   *
   * @example
   * ```typescript
   * public async init(): Promise<void> {
   *   await super.init();
   *   await this.loadInitialData();
   * }
   * ```
   */
  public async init(): Promise<void> {}

  /**
   * Disposes the service and cleans up resources. Override this method to perform service-specific cleanup.
   *
   * This method is called during server shutdown to allow services to clean up resources,
   * close connections, save state, or perform other cleanup operations.
   *
   * @example
   * ```typescript
   * public async dispose(): Promise<void> {
   *   await this.saveState();
   *   this.closeConnections();
   *   await super.dispose();
   * }
   * ```
   */
  public async dispose(): Promise<void> {}

  /**
   * Scans the service instance for @OnServer decorated methods and binds them to events.
   *
   * @private
   * @param eventEmitter - The event emitter to bind handlers to
   * @returns A map of event names to their bound handler functions
   */
  private bindEventEmitters(
    eventEmitter: RPEventEmitter<RPServerEvents>,
  ): RPServerEventHandlerMethods {
    const handlers = getEventHandlers(this) || [];
    const handlerMethods: RPServerEventHandlerMethods = {};
    for (const { method, event } of handlers) {
      const fn = (this as Record<string, unknown>)[method];
      if (typeof fn === 'function') {
        eventEmitter.on(event, fn.bind(this));
        handlerMethods[event] = fn.bind(this);
      }
    }

    return handlerMethods;
  }

  /**
   * Gets a roleplay engine API instance for making HTTP requests.
   *
   * This method provides access to the underlying roleplay-engine-sdk APIs
   * with proper authentication and configuration.
   *
   * @template Api - The API class type
   * @param ApiConstructor - The API class constructor
   * @returns An instance of the requested API
   *
   * @example
   * ```typescript
   * const accountApi = this.getEngineApi(AccountApi);
   * const account = await accountApi.getAccountById(accountId);
   * ```
   */
  protected getEngineApi<Api>(ApiConstructor: new (client: EngineClient) => Api): Api {
    return this.context.getEngineApi(ApiConstructor);
  }

  /**
   * Gets another service instance from the server context.
   *
   * Use this to access functionality provided by other services. Services are
   * singletons within the server context.
   *
   * @template Service - The service class type
   * @param ServiceConstructor - The service class constructor
   * @returns An instance of the requested service
   *
   * @example
   * ```typescript
   * const accountService = this.getService(AccountService);
   * const account = await accountService.getAccount(accountId);
   * ```
   */
  protected getService<Service extends RPServerService>(
    ServiceConstructor: new (context: C) => Service,
  ): Service {
    return this.context.getService(ServiceConstructor);
  }
}
