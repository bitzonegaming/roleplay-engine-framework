/**
 * Tests for SessionService
 */
import { AccessPolicy, SessionEndReason } from '@bitzonegaming/roleplay-engine-sdk';

import { ConflictError, ForbiddenError, NotFoundError } from '../../core/errors';
import { RPEventEmitter } from '../../../core/bus/event-emitter';
import { RPHookBus } from '../../../core/bus/hook-bus';
import { MockLogger } from '../../../../test/mocks';
import { RPServerContext } from '../../core/context';
import { RPServerEvents } from '../../core/events/events';
import { RPServerHooks } from '../../core/hooks/hooks';

import { SessionService } from './service';
import { RPSession, SessionId, generateSessionTokenHash } from './models/session';

describe('SessionService', () => {
  let mockLogger: MockLogger;
  let mockEventEmitter: RPEventEmitter<RPServerEvents>;
  let mockHookBus: RPHookBus<RPServerHooks>;
  let mockContext: RPServerContext;
  let sessionService: SessionService;

  // Test data
  const testSessionId: SessionId = 'sess_test123';
  const testSession: RPSession = {
    id: testSessionId,
    tokenHash: 'abcd1234hash',
    hash: 'session_hash_123',
  };

  const testSessionWithAccount: RPSession = {
    ...testSession,
    account: {
      id: 'acc_test123',
      username: 'testuser',
      segmentDefinitionIds: [],
      authorizedDate: Date.now(),
    },
  };

  const testSessionWithCharacter: RPSession = {
    ...testSessionWithAccount,
    character: {
      id: 'char_test123',
      firstName: 'Test',
      lastName: 'Character',
      fullName: 'Test Character',
      linkedDate: Date.now(),
      segmentDefinitionIds: [],
    },
  };

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockEventEmitter = new RPEventEmitter<RPServerEvents>();
    mockHookBus = new RPHookBus<RPServerHooks>();

    mockContext = {
      logger: mockLogger,
      eventEmitter: mockEventEmitter,
      hookBus: mockHookBus,
      getEngineApi: jest.fn().mockReturnValue({
        startSession: jest.fn().mockResolvedValue({ token: 'session_token_123' }),
        authorizeSession: jest.fn().mockResolvedValue({}),
        linkCharacterToSession: jest.fn().mockResolvedValue({}),
        finishSession: jest.fn().mockResolvedValue({}),
        getActiveSessionInfo: jest.fn().mockResolvedValue(testSessionWithAccount),
      }),
      getService: jest.fn(),
    } as unknown as RPServerContext;

    sessionService = new SessionService(mockContext);
  });

  describe('getSession', () => {
    it('should return session if exists in cache', () => {
      sessionService['sessions'].set(testSessionId, testSession);

      const result = sessionService.getSession(testSessionId);

      expect(result).toBe(testSession);
    });

    it('should return undefined if session does not exist', () => {
      const result = sessionService.getSession('nonexistent_session');

      expect(result).toBeUndefined();
    });
  });

  describe('generateTokenHash', () => {
    it('should generate consistent hash for same inputs', () => {
      const sessionId = 'sess_123';
      const token = 'token_abc';

      const hash1 = generateSessionTokenHash(sessionId, token);
      const hash2 = generateSessionTokenHash(sessionId, token);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = generateSessionTokenHash('sess_1', 'token_a');
      const hash2 = generateSessionTokenHash('sess_2', 'token_b');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('authorizeSession', () => {
    it('should delegate to SessionApi', async () => {
      const request = { accessToken: 'access_token_123' };

      await sessionService.authorizeSession(testSessionId, request);

      expect(mockContext.getEngineApi).toHaveBeenCalled();
    });
  });

  describe('linkCharacterToSession', () => {
    it('should delegate to SessionApi', async () => {
      const request = { characterId: 'char_123' };

      await sessionService.linkCharacterToSession(testSessionId, request);

      expect(mockContext.getEngineApi).toHaveBeenCalled();
    });
  });

  describe('validateAccessPolicy', () => {
    it('should not throw when session has the required access policy', () => {
      const mockReferenceService = {
        hasAccessPolicyInSegmentDefinitions: jest.fn().mockReturnValue(true),
      };
      (mockContext.getService as jest.Mock).mockReturnValue(mockReferenceService);
      sessionService['sessions'].set(testSessionId, testSessionWithAccount);

      expect(() => {
        sessionService.validateAccessPolicy(testSessionId, AccessPolicy.AccountRead);
      }).not.toThrow();

      expect(mockReferenceService.hasAccessPolicyInSegmentDefinitions).toHaveBeenCalledWith(
        AccessPolicy.AccountRead,
        testSessionWithAccount.account?.segmentDefinitionIds,
      );
    });

    it('should throw ForbiddenError when session lacks the required access policy', () => {
      const mockReferenceService = {
        hasAccessPolicyInSegmentDefinitions: jest.fn().mockReturnValue(false),
      };
      (mockContext.getService as jest.Mock).mockReturnValue(mockReferenceService);
      sessionService['sessions'].set(testSessionId, testSessionWithAccount);

      expect(() => {
        sessionService.validateAccessPolicy(testSessionId, AccessPolicy.AccountWrite);
      }).toThrow(ForbiddenError);
    });

    it('should throw NotFoundError when session does not exist', () => {
      expect(() => {
        sessionService.validateAccessPolicy('non_existent_session', AccessPolicy.AccountRead);
      }).toThrow(NotFoundError);
    });

    it('should throw ConflictError when session has no account', () => {
      sessionService['sessions'].set(testSessionId, testSession);

      expect(() => {
        sessionService.validateAccessPolicy(testSessionId, AccessPolicy.AccountRead);
      }).toThrow(ConflictError);
    });
  });

  describe('hasAccessPolicy', () => {
    let mockReferenceService: {
      hasAccessPolicyInSegmentDefinitions: jest.MockedFunction<
        (accessPolicy: AccessPolicy, segmentDefinitionIds: ReadonlyArray<string>) => boolean
      >;
    };

    beforeEach(() => {
      mockReferenceService = {
        hasAccessPolicyInSegmentDefinitions: jest.fn(),
      };
      (mockContext.getService as jest.Mock).mockReturnValue(mockReferenceService);
    });

    it('should return true when account has the access policy', () => {
      mockReferenceService.hasAccessPolicyInSegmentDefinitions.mockReturnValue(true);
      sessionService['sessions'].set(testSessionId, testSessionWithAccount);

      const result = sessionService.hasAccessPolicy(testSessionId, AccessPolicy.AccountRead);

      expect(result).toBe(true);
      expect(mockReferenceService.hasAccessPolicyInSegmentDefinitions).toHaveBeenCalledWith(
        AccessPolicy.AccountRead,
        testSessionWithAccount.account?.segmentDefinitionIds,
      );
    });

    it('should return true when character has the access policy', () => {
      mockReferenceService.hasAccessPolicyInSegmentDefinitions
        .mockReturnValueOnce(false) // account check fails
        .mockReturnValueOnce(true); // character check succeeds
      sessionService['sessions'].set(testSessionId, testSessionWithCharacter);

      const result = sessionService.hasAccessPolicy(testSessionId, AccessPolicy.CharacterRead);

      expect(result).toBe(true);
      expect(mockReferenceService.hasAccessPolicyInSegmentDefinitions).toHaveBeenCalledTimes(2);
      expect(mockReferenceService.hasAccessPolicyInSegmentDefinitions).toHaveBeenNthCalledWith(
        1,
        AccessPolicy.CharacterRead,
        testSessionWithCharacter.account?.segmentDefinitionIds,
      );
      expect(mockReferenceService.hasAccessPolicyInSegmentDefinitions).toHaveBeenNthCalledWith(
        2,
        AccessPolicy.CharacterRead,
        testSessionWithCharacter.character?.segmentDefinitionIds,
      );
    });

    it('should return false when neither account nor character has the access policy', () => {
      mockReferenceService.hasAccessPolicyInSegmentDefinitions.mockReturnValue(false);
      sessionService['sessions'].set(testSessionId, testSessionWithCharacter);

      const result = sessionService.hasAccessPolicy(testSessionId, AccessPolicy.AccountWrite);

      expect(result).toBe(false);
      expect(mockReferenceService.hasAccessPolicyInSegmentDefinitions).toHaveBeenCalledTimes(2);
    });

    it('should return false when account lacks policy and no character is linked', () => {
      mockReferenceService.hasAccessPolicyInSegmentDefinitions.mockReturnValue(false);
      sessionService['sessions'].set(testSessionId, testSessionWithAccount);

      const result = sessionService.hasAccessPolicy(testSessionId, AccessPolicy.AccountWrite);

      expect(result).toBe(false);
      expect(mockReferenceService.hasAccessPolicyInSegmentDefinitions).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when session does not exist', () => {
      expect(() => {
        sessionService.hasAccessPolicy('non_existent_session', AccessPolicy.AccountRead);
      }).toThrow(NotFoundError);
    });

    it('should throw ConflictError when session has no account', () => {
      sessionService['sessions'].set(testSessionId, testSession);

      expect(() => {
        sessionService.hasAccessPolicy(testSessionId, AccessPolicy.AccountRead);
      }).toThrow(ConflictError);
    });

    it('should prioritize account access policy over character access policy', () => {
      mockReferenceService.hasAccessPolicyInSegmentDefinitions
        .mockReturnValueOnce(true) // account check succeeds
        .mockReturnValueOnce(false); // character check would fail, but shouldn't be called
      sessionService['sessions'].set(testSessionId, testSessionWithCharacter);

      const result = sessionService.hasAccessPolicy(testSessionId, AccessPolicy.AccountRead);

      expect(result).toBe(true);
      expect(mockReferenceService.hasAccessPolicyInSegmentDefinitions).toHaveBeenCalledTimes(1);
    });
  });

  describe('event handlers', () => {
    describe('onPlayerConnecting', () => {
      it('should start session and emit sessionStarted event', async () => {
        const emitSpy = jest.spyOn(mockEventEmitter, 'emit');

        mockEventEmitter.emit('playerConnecting', {
          sessionId: testSessionId,
          ipAddress: '192.168.1.1',
        });

        // Wait for async handler
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(sessionService['sessions'].has(testSessionId)).toBe(true);
        expect(emitSpy).toHaveBeenCalledWith('sessionStarted', {
          sessionId: testSessionId,
          sessionToken: 'session_token_123',
        });
      });

      it('should emit sessionFinished event on session start failure', async () => {
        const emitSpy = jest.spyOn(mockEventEmitter, 'emit');
        (mockContext.getEngineApi as jest.Mock).mockReturnValue({
          startSession: jest.fn().mockRejectedValue(new Error('API Error')),
        });

        mockEventEmitter.emit('playerConnecting', {
          sessionId: testSessionId,
          ipAddress: '192.168.1.1',
        });

        // Wait for async handler
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(emitSpy).toHaveBeenCalledWith('sessionFinished', {
          sessionId: testSessionId,
          endReason: SessionEndReason.SessionInitFailed,
        });
      });
    });

    describe('onPlayerDisconnected', () => {
      it('should finish session via API', async () => {
        const mockSessionApi = {
          finishSession: jest.fn().mockResolvedValue({}),
        };
        (mockContext.getEngineApi as jest.Mock).mockReturnValue(mockSessionApi);

        mockEventEmitter.emit('playerDisconnected', {
          sessionId: testSessionId,
          reason: SessionEndReason.ConnectionDropped,
        });

        // Wait for async handler
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mockSessionApi.finishSession).toHaveBeenCalledWith(testSessionId, {
          endReason: SessionEndReason.ConnectionDropped,
        });
      });
    });

    describe('onSocketSessionStarted', () => {
      it('should update session with hash', async () => {
        sessionService['sessions'].set(testSessionId, testSession);

        mockEventEmitter.emit('socketSessionStarted', {
          id: testSessionId,
          ipAddress: '192.168.1.1',
          hash: 'new_hash_123',
          timestamp: Date.now(),
        });

        // Wait for async handler
        await new Promise((resolve) => setTimeout(resolve, 10));

        const updatedSession = sessionService['sessions'].get(testSessionId);
        expect(updatedSession?.hash).toBe('new_hash_123');
      });
    });

    describe('onSocketSessionFinished', () => {
      beforeEach(() => {
        sessionService['sessions'].set(testSessionId, testSession);
      });

      it('should remove session and emit sessionFinished event', async () => {
        const emitSpy = jest.spyOn(mockEventEmitter, 'emit');

        mockEventEmitter.emit('socketSessionFinished', {
          id: testSessionId,
          ipAddress: '192.168.1.1',
          accountId: 'acc_123',
          characterId: 'char_123',
          endReason: SessionEndReason.ConnectionDropped,
          endReasonText: 'Connection lost',
          hash: 'session_hash_123',
          timestamp: Date.now(),
        });

        expect(sessionService['sessions'].has(testSessionId)).toBe(false);
        expect(emitSpy).toHaveBeenCalledWith('sessionFinished', {
          sessionId: testSessionId,
          accountId: 'acc_123',
          characterId: 'char_123',
          endReason: SessionEndReason.ConnectionDropped,
          endReasonText: 'Connection lost',
        });
      });

      it('should do nothing if session does not exist', async () => {
        sessionService['sessions'].delete(testSessionId);
        const emitSpy = jest.spyOn(mockEventEmitter, 'emit');

        mockEventEmitter.emit('socketSessionFinished', {
          id: testSessionId,
          ipAddress: '192.168.1.1',
          accountId: 'acc_123',
          endReason: SessionEndReason.ConnectionDropped,
          hash: 'session_hash_123',
          timestamp: Date.now(),
        });

        expect(emitSpy).toHaveBeenCalledTimes(1); // Only the original emit
      });
    });

    describe('onSocketSessionAuthorized', () => {
      beforeEach(() => {
        sessionService['sessions'].set(testSessionId, testSession);
      });

      it('should refresh session and emit sessionAuthorized event', async () => {
        const emitSpy = jest.spyOn(mockEventEmitter, 'emit');

        mockEventEmitter.emit('socketSessionAuthorized', {
          id: testSessionId,
          ipAddress: '192.168.1.1',
          accountId: 'acc_test123',
          signInMethod: 'password',
          authorizedDate: Date.now(),
          hash: 'session_hash_123',
          timestamp: Date.now(),
        });

        // Wait for async handler
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(emitSpy).toHaveBeenCalledWith('sessionAuthorized', {
          sessionId: testSessionId,
          account: testSessionWithAccount.account,
        });
      });

      it('should do nothing if session has no account after refresh', async () => {
        (mockContext.getEngineApi as jest.Mock).mockReturnValue({
          getActiveSessionInfo: jest.fn().mockResolvedValue({ ...testSession, account: null }),
        });
        const emitSpy = jest.spyOn(mockEventEmitter, 'emit');

        mockEventEmitter.emit('socketSessionAuthorized', {
          id: testSessionId,
          ipAddress: '192.168.1.1',
          accountId: 'acc_test123',
          signInMethod: 'password',
          authorizedDate: Date.now(),
          hash: 'session_hash_123',
          timestamp: Date.now(),
        });

        // Wait for async handler
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(emitSpy).toHaveBeenCalledTimes(1); // Only the original emit
      });
    });

    describe('onSocketSessionCharacterLinked', () => {
      beforeEach(() => {
        sessionService['sessions'].set(testSessionId, testSession);
      });

      it('should refresh session and emit sessionCharacterLinked event', async () => {
        (mockContext.getEngineApi as jest.Mock).mockReturnValue({
          getActiveSessionInfo: jest.fn().mockResolvedValue(testSessionWithCharacter),
        });
        const emitSpy = jest.spyOn(mockEventEmitter, 'emit');

        mockEventEmitter.emit('socketSessionCharacterLinked', {
          id: testSessionId,
          ipAddress: '192.168.1.1',
          accountId: 'acc_test123',
          characterId: 'char_test123',
          characterLinkedDate: Date.now(),
          signInMethod: 'password',
          authorizedDate: Date.now() - 1000,
          hash: 'session_hash_123',
          timestamp: Date.now(),
        });

        // Wait for async handler
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(emitSpy).toHaveBeenCalledWith('sessionCharacterLinked', {
          sessionId: testSessionId,
          account: testSessionWithCharacter.account,
          character: testSessionWithCharacter.character,
        });
      });
    });

    describe('onSocketSessionUpdated', () => {
      beforeEach(() => {
        sessionService['sessions'].set(testSessionId, { ...testSession, hash: 'old_hash' });
      });

      it('should refresh session and emit sessionUpdated event when hash changes', async () => {
        const emitSpy = jest.spyOn(mockEventEmitter, 'emit');

        mockEventEmitter.emit('socketSessionUpdated', {
          id: testSessionId,
          hash: 'new_hash',
          timestamp: Date.now(),
        });

        // Wait for async handler
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(emitSpy).toHaveBeenCalledWith('sessionUpdated', {
          sessionId: testSessionId,
          account: testSessionWithAccount.account,
          character: testSessionWithAccount.character,
        });
      });

      it('should do nothing if hash has not changed', async () => {
        sessionService['sessions'].set(testSessionId, { ...testSession, hash: 'same_hash' });
        const emitSpy = jest.spyOn(mockEventEmitter, 'emit');

        mockEventEmitter.emit('socketSessionUpdated', {
          id: testSessionId,
          hash: 'same_hash',
          timestamp: Date.now(),
        });

        // Wait for async handler
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(emitSpy).toHaveBeenCalledTimes(1); // Only the original emit
      });
    });
  });

  describe('cache management', () => {
    it('should maintain separate sessions in cache', () => {
      const session1: RPSession = { ...testSession, id: 'sess_1' };
      const session2: RPSession = { ...testSession, id: 'sess_2' };

      sessionService['sessions'].set('sess_1', session1);
      sessionService['sessions'].set('sess_2', session2);

      expect(sessionService['sessions'].get('sess_1')).toEqual(session1);
      expect(sessionService['sessions'].get('sess_2')).toEqual(session2);
      expect(sessionService['sessions'].size).toBe(2);
    });

    it('should handle session updates correctly', () => {
      sessionService['sessions'].set(testSessionId, testSession);

      const updatedSession = { ...testSession, hash: 'updated_hash' };
      sessionService['sessions'].set(testSessionId, updatedSession);

      expect(sessionService['sessions'].get(testSessionId)).toEqual(updatedSession);
      expect(sessionService['sessions'].size).toBe(1);
    });
  });
});
