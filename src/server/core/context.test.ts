/**
 * Tests for RPServerContext
 */
import { EngineClient } from '@bitzonegaming/roleplay-engine-sdk';

import { RPEventEmitter } from '../../core/bus/event-emitter';
import { RPHookBus } from '../../core/bus/hook-bus';
import { MockEngineClient, MockLogger } from '../../../test/mocks';

import { RPServerContext, RPServerContextOptions } from './context';
import { RPServerService } from './server-service';
import { RPServerEvents } from './events/events';
import { RPServerHooks } from './hooks/hooks';

// Test service implementations
class TestService extends RPServerService {
  public initCalled = false;
  public disposeCalled = false;

  public async init(): Promise<void> {
    this.initCalled = true;
    await super.init();
  }

  public async dispose(): Promise<void> {
    this.disposeCalled = true;
    await super.dispose();
  }

  public testMethod(): string {
    return 'test';
  }
}

class AnotherTestService extends RPServerService {
  public initCalled = false;
  public disposeCalled = false;

  public async init(): Promise<void> {
    this.initCalled = true;
    await super.init();
  }

  public async dispose(): Promise<void> {
    this.disposeCalled = true;
    await super.dispose();
  }
}

class ThrowingInitService extends RPServerService {
  public async init(): Promise<void> {
    throw new Error('Init error');
  }
}

class ThrowingDisposeService extends RPServerService {
  public async dispose(): Promise<void> {
    throw new Error('Dispose error');
  }
}

// Test API classes
class TestApi {
  constructor(private _client: unknown) {}

  public testApiMethod(): Promise<string> {
    return Promise.resolve('api-result');
  }
}

class AnotherTestApi {
  constructor(private _client: unknown) {}

  public anotherApiMethod(): Promise<number> {
    return Promise.resolve(42);
  }
}

// Custom context implementation for testing
class CustomServerContext extends RPServerContext {
  public customProperty = 'custom';

  public getCustomProperty(): string {
    return this.customProperty;
  }
}

describe('RPServerContext', () => {
  let mockLogger: MockLogger;
  let mockEngineClient: MockEngineClient;
  let mockEventEmitter: RPEventEmitter<RPServerEvents>;
  let mockHookBus: RPHookBus<RPServerHooks>;
  let contextOptions: RPServerContextOptions;
  let context: RPServerContext;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockEngineClient = new MockEngineClient();
    mockEventEmitter = new RPEventEmitter<RPServerEvents>();
    mockHookBus = new RPHookBus<RPServerHooks>();

    contextOptions = {
      logger: mockLogger,
      engineClient: mockEngineClient as unknown as EngineClient,
      eventEmitter: mockEventEmitter,
      hookBus: mockHookBus,
    };

    context = new RPServerContext(contextOptions);
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      expect(context.logger).toBe(mockLogger);
      expect(context.eventEmitter).toBe(mockEventEmitter);
      expect(context.hookBus).toBe(mockHookBus);
      expect(context['engineClient']).toBe(mockEngineClient);
    });

    it('should start with uninitialized state', () => {
      expect(context['initialized']).toBe(false);
      expect(context['services'].size).toBe(0);
      expect(context['apis'].size).toBe(0);
    });
  });

  describe('static create factory method', () => {
    it('should create context with default constructor', () => {
      const createdContext = RPServerContext.create(RPServerContext, contextOptions);

      expect(createdContext).toBeInstanceOf(RPServerContext);
      expect(createdContext.logger).toBe(mockLogger);
      expect(createdContext.eventEmitter).toBe(mockEventEmitter);
    });

    it('should create context with custom constructor', () => {
      const customContext = RPServerContext.create(CustomServerContext, contextOptions);

      expect(customContext).toBeInstanceOf(CustomServerContext);
      expect(customContext).toBeInstanceOf(RPServerContext);
      expect((customContext as CustomServerContext).getCustomProperty()).toBe('custom');
      expect(customContext.logger).toBe(mockLogger);
    });

    it('should support custom context extensions', () => {
      class ExtendedContext extends RPServerContext {
        public specialMethod(): string {
          return 'special';
        }
      }

      const extendedContext = RPServerContext.create(ExtendedContext, contextOptions);

      expect(extendedContext).toBeInstanceOf(ExtendedContext);
      expect((extendedContext as ExtendedContext).specialMethod()).toBe('special');
    });
  });

  describe('getApi', () => {
    it('should create and cache API instances', () => {
      const api1 = context.getApi(TestApi);
      const api2 = context.getApi(TestApi);

      expect(api1).toBeInstanceOf(TestApi);
      expect(api2).toBe(api1); // Same instance (cached)
      expect(context['apis'].size).toBe(1);
    });

    it('should create different instances for different API types', () => {
      const testApi = context.getApi(TestApi);
      const anotherApi = context.getApi(AnotherTestApi);

      expect(testApi).toBeInstanceOf(TestApi);
      expect(anotherApi).toBeInstanceOf(AnotherTestApi);
      expect(testApi).not.toBe(anotherApi);
      expect(context['apis'].size).toBe(2);
    });

    it('should pass engine client to API constructors', () => {
      const api = context.getApi(TestApi);

      expect(api).toBeInstanceOf(TestApi);
      expect(api['_client']).toBe(mockEngineClient);
    });

    it('should support multiple API retrievals', () => {
      const api1 = context.getApi(TestApi);
      const api2 = context.getApi(AnotherTestApi);
      const api3 = context.getApi(TestApi); // Should be cached

      expect(api1).toBeInstanceOf(TestApi);
      expect(api2).toBeInstanceOf(AnotherTestApi);
      expect(api3).toBe(api1);
      expect(context['apis'].size).toBe(2);
    });
  });

  describe('addService', () => {
    it('should register services successfully', () => {
      const result = context.addService(TestService);

      expect(result).toBe(context); // Returns this for chaining
      expect(context['services'].size).toBe(1);
      expect(context['services'].has(TestService)).toBe(true);
    });

    it('should support method chaining', () => {
      const result = context.addService(TestService).addService(AnotherTestService);

      expect(result).toBe(context);
      expect(context['services'].size).toBe(2);
    });

    it('should create service instances with context injection', () => {
      context.addService(TestService);

      const service = context['services'].get(TestService) as TestService;
      expect(service).toBeInstanceOf(TestService);
      expect(service['context']).toBe(context);
    });

    it('should throw error when adding service after initialization', async () => {
      await context.init();

      expect(() => {
        context.addService(TestService);
      }).toThrow('Cannot add service after server start.');
    });

    it('should allow adding same service type multiple times before init', () => {
      context.addService(TestService);

      expect(() => {
        context.addService(TestService);
      }).not.toThrow();

      // Second registration should replace the first
      expect(context['services'].size).toBe(1);
    });
  });

  describe('getService', () => {
    beforeEach(() => {
      context.addService(TestService);
      context.addService(AnotherTestService);
    });

    it('should retrieve registered services', () => {
      const service = context.getService(TestService);

      expect(service).toBeInstanceOf(TestService);
      expect(service).toBe(context['services'].get(TestService));
    });

    it('should return same instance for multiple calls', () => {
      const service1 = context.getService(TestService);
      const service2 = context.getService(TestService);

      expect(service1).toBe(service2);
    });

    it('should return different instances for different service types', () => {
      const testService = context.getService(TestService);
      const anotherService = context.getService(AnotherTestService);

      expect(testService).toBeInstanceOf(TestService);
      expect(anotherService).toBeInstanceOf(AnotherTestService);
      expect(testService).not.toBe(anotherService);
    });

    it('should throw error for unregistered services', () => {
      class UnregisteredService extends RPServerService {}

      expect(() => {
        context.getService(UnregisteredService);
      }).toThrow('Service UnregisteredService not registered in the context.');
    });
  });

  describe('init', () => {
    it('should initialize all registered services', async () => {
      context.addService(TestService);
      context.addService(AnotherTestService);

      await context.init();

      const testService = context.getService(TestService) as TestService;
      const anotherService = context.getService(AnotherTestService) as AnotherTestService;

      expect(testService.initCalled).toBe(true);
      expect(anotherService.initCalled).toBe(true);
      expect(context['initialized']).toBe(true);
    });

    it('should only initialize once', async () => {
      const service = new TestService(context);
      jest.spyOn(service, 'init');
      context['services'].set(TestService, service);

      await context.init();
      await context.init(); // Second call

      expect(service.init).toHaveBeenCalledTimes(1);
    });

    it('should handle services without registered services', async () => {
      await context.init();

      expect(context['initialized']).toBe(true);
    });

    it('should initialize services in registration order', async () => {
      const initOrder: string[] = [];

      class FirstService extends RPServerService {
        public async init(): Promise<void> {
          initOrder.push('first');
          await super.init();
        }
      }

      class SecondService extends RPServerService {
        public async init(): Promise<void> {
          initOrder.push('second');
          await super.init();
        }
      }

      context.addService(FirstService);
      context.addService(SecondService);

      await context.init();

      expect(initOrder).toEqual(['first', 'second']);
    });

    it('should propagate initialization errors', async () => {
      context.addService(ThrowingInitService);

      await expect(context.init()).rejects.toThrow('Init error');
      expect(context['initialized']).toBe(true); // Still marked as initialized
    });
  });

  describe('dispose', () => {
    beforeEach(async () => {
      context.addService(TestService);
      context.addService(AnotherTestService);
      await context.init();
    });

    it('should dispose all services in reverse order', async () => {
      const disposeOrder: string[] = [];

      class FirstService extends RPServerService {
        public async dispose(): Promise<void> {
          disposeOrder.push('first');
          await super.dispose();
        }
      }

      class SecondService extends RPServerService {
        public async dispose(): Promise<void> {
          disposeOrder.push('second');
          await super.dispose();
        }
      }

      const localContext = new RPServerContext(contextOptions);
      localContext.addService(FirstService);
      localContext.addService(SecondService);
      await localContext.init();

      await localContext.dispose();

      expect(disposeOrder).toEqual(['second', 'first']); // Reverse order
    });

    it('should call dispose on all registered services', async () => {
      await context.dispose();

      const testService = context.getService(TestService) as TestService;
      const anotherService = context.getService(AnotherTestService) as AnotherTestService;

      expect(testService.disposeCalled).toBe(true);
      expect(anotherService.disposeCalled).toBe(true);
      expect(context['initialized']).toBe(false);
    });

    it('should handle disposal errors gracefully and log them', async () => {
      const localContext = new RPServerContext(contextOptions);
      localContext.addService(ThrowingDisposeService);
      localContext.addService(TestService);
      await localContext.init();

      await localContext.dispose();

      expect(
        mockLogger.logs.some(
          (log) =>
            log.level === 'error' &&
            log.message.includes('Error disposing service ThrowingDisposeService'),
        ),
      ).toBe(true);

      // Should still dispose other services
      const testService = localContext.getService(TestService) as TestService;
      expect(testService.disposeCalled).toBe(true);
      expect(localContext['initialized']).toBe(false);
    });

    it('should do nothing if context is not initialized', async () => {
      const uninitializedContext = new RPServerContext(contextOptions);
      uninitializedContext.addService(TestService);

      await uninitializedContext.dispose();

      const service = uninitializedContext.getService(TestService) as TestService;
      expect(service.disposeCalled).toBe(false);
    });

    it('should handle empty services list', async () => {
      const emptyContext = new RPServerContext(contextOptions);
      await emptyContext.init();

      await expect(emptyContext.dispose()).resolves.not.toThrow();
      expect(emptyContext['initialized']).toBe(false);
    });
  });

  describe('integration', () => {
    it('should support full lifecycle with multiple services and APIs', async () => {
      // Register services
      context.addService(TestService).addService(AnotherTestService);

      // Initialize context
      await context.init();

      // Get services
      const testService = context.getService(TestService) as TestService;
      const anotherService = context.getService(AnotherTestService) as AnotherTestService;

      // Get APIs
      const testApi = context.getApi(TestApi);
      const anotherApi = context.getApi(AnotherTestApi);

      // Verify everything works
      expect(testService.initCalled).toBe(true);
      expect(anotherService.initCalled).toBe(true);
      expect(testService.testMethod()).toBe('test');
      expect(await testApi.testApiMethod()).toBe('api-result');
      expect(await anotherApi.anotherApiMethod()).toBe(42);

      // Dispose
      await context.dispose();

      expect(testService.disposeCalled).toBe(true);
      expect(anotherService.disposeCalled).toBe(true);
      expect(context['initialized']).toBe(false);
    });

    it('should handle complex service dependencies', async () => {
      class DependentService extends RPServerService {
        public initCalled = false;

        public async init(): Promise<void> {
          // Use another service during init
          const testService = this.getService(TestService);
          expect(testService).toBeInstanceOf(TestService);
          this.initCalled = true;
          await super.init();
        }
      }

      context.addService(TestService);
      context.addService(DependentService);

      await context.init();

      const dependentService = context.getService(DependentService) as DependentService;
      expect(dependentService.initCalled).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle service constructor errors', () => {
      class BadService extends RPServerService {
        constructor(context: RPServerContext) {
          super(context);
          throw new Error('Constructor error');
        }
      }

      expect(() => {
        context.addService(BadService);
      }).toThrow('Constructor error');
    });

    it('should maintain context state after service errors', async () => {
      context.addService(TestService);
      context.addService(ThrowingInitService);

      await expect(context.init()).rejects.toThrow('Init error');

      // Context should still be marked as initialized
      expect(context['initialized']).toBe(true);

      // Working service should still be available
      const testService = context.getService(TestService) as TestService;
      expect(testService.initCalled).toBe(true);
    });
  });
});
