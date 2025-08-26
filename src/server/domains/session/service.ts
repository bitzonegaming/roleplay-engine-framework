import {
  AccessPolicy,
  AuthorizeSessionRequest,
  EngineError,
  LinkCharacterToSessionRequest,
  SessionApi,
  SessionEndReason,
} from '@bitzonegaming/roleplay-engine-sdk';

import { SocketSessionStarted } from '../../socket/events/socket-session-started';
import { RPPlayerConnecting } from '../../natives/events/player/player-connecting';
import { SocketSessionAuthorized } from '../../socket/events/socket-session-authorized';
import { SocketSessionFinished } from '../../socket/events/socket-session-finished';
import { RPServerService } from '../../core/server-service';
import { OnServer } from '../../core/events/decorators';
import { SocketSessionCharacterLinked } from '../../socket/events/socket-session-character-linked';
import { SocketSessionUpdated } from '../../socket/events/socket-session-updated';
import { RPPlayerDisconnected } from '../../natives/events/player/player-disconnected';
import { ConflictError, ForbiddenError, NotFoundError } from '../../core/errors';
import { ReferenceService } from '../reference/service';

import { generateSessionTokenHash, RPSession, SessionId } from './models/session';

/**
 * Service for managing player sessions in the roleplay server.
 *
 * This service provides functionality for:
 * - Session lifecycle management (start, authorize, finish)
 * - Session token generation and verification
 * - Character linking to active sessions
 * - Session state caching and synchronization
 *
 * The service maintains a local cache of active sessions that gets populated
 * when players connect and cleaned up when sessions end. It handles the complete
 * session workflow from initial connection through authentication and character selection.
 *
 * @example
 * ```typescript
 * // Get an active session
 * const session = sessionService.getSession(sessionId);
 *
 * // Authorize a session
 * await sessionService.authorizeSession(sessionId, {
 *   accessToken: 'player_access_token'
 * });
 *
 * // Link character to session
 * await sessionService.linkCharacterToSession(sessionId, {
 *   characterId: 'char_12345'
 * });
 * ```
 */
export class SessionService extends RPServerService {
  /** Cache of active player sessions indexed by session ID */
  private readonly sessions: Map<SessionId, RPSession> = new Map([]);

  /**
   * Retrieves a session by its unique identifier.
   *
   * Returns the cached session data if available. This method provides quick access
   * to session information without making API calls. Sessions are automatically
   * cached when players connect and updated through socket events.
   *
   * @param sessionId - The unique identifier of the session
   * @returns The session data if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const session = sessionService.getSession('sess_12345');
   * if (session) {
   *   console.log(`Session for account: ${session.account?.id}`);
   * }
   * ```
   */
  public getSession(sessionId: SessionId): RPSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Authorizes a session using an access token.
   *
   * This method authenticates a player session by validating their access token
   * with the roleplay engine. Once authorized, the session becomes associated
   * with the player's account and can access account-specific features.
   *
   * @param sessionId - The unique identifier of the session to authorize
   * @param request - The authorization request containing the access token
   * @returns Promise resolving when authorization is complete
   * @throws {EngineError} When authorization fails (invalid token, expired, etc.)
   *
   * @example
   * ```typescript
   * await sessionService.authorizeSession('sess_12345', {
   *   accessToken: 'player_access_token_here'
   * });
   * ```
   */
  public authorizeSession(sessionId: SessionId, request: AuthorizeSessionRequest) {
    return this.getEngineApi(SessionApi).authorizeSession(sessionId, request);
  }

  /**
   * Links a character to an authorized session.
   *
   * This method associates a specific character with the player's session,
   * allowing them to enter the game world. The session must already be
   * authorized before a character can be linked.
   *
   * @param sessionId - The unique identifier of the authorized session
   * @param request - The character linking request containing character ID
   * @returns Promise resolving when character is successfully linked
   * @throws {EngineError} When linking fails (session not authorized, character not found, etc.)
   *
   * @example
   * ```typescript
   * await sessionService.linkCharacterToSession('sess_12345', {
   *   characterId: 'char_67890'
   * });
   * ```
   */
  public linkCharacterToSession(sessionId: SessionId, request: LinkCharacterToSessionRequest) {
    return this.getEngineApi(SessionApi).linkCharacterToSession(sessionId, request);
  }

  /**
   * Validates that a session has the required access policy.
   *
   * This method checks if the session has the specified access policy and throws
   * a ForbiddenError if the policy is not granted. Used for authorization checks
   * before allowing access to protected resources or operations.
   *
   * @param sessionId - The unique identifier of the session to validate
   * @param accessPolicy - The access policy that must be present
   * @throws {ForbiddenError} When the session lacks the required access policy
   * @throws {NotFoundError} When the session is not found
   * @throws {ConflictError} When the session is not authorized
   *
   * @example
   * ```typescript
   * // Will throw if session doesn't have AccountWrite policy
   * sessionService.validateAccessPolicy('sess_123', AccessPolicy.AccountWrite);
   * ```
   */
  public validateAccessPolicy(sessionId: SessionId, accessPolicy: AccessPolicy): void {
    if (!this.hasAccessPolicy(sessionId, accessPolicy)) {
      throw new ForbiddenError('INSUFFICIENT_ACCESS_LEVEL', { accessPolicy });
    }
  }

  /**
   * Checks if a session has a specific access policy.
   *
   * This method determines whether the session has the required access policy
   * by checking both account-level and character-level segment definitions.
   * The session must be authorized (have an associated account) to perform
   * access policy checks.
   *
   * @param sessionId - The unique identifier of the session to check
   * @param accessPolicy - The access policy to verify
   * @returns True if the session has the access policy, false otherwise
   * @throws {NotFoundError} When the session is not found
   * @throws {ConflictError} When the session is not authorized (no account)
   *
   * @example
   * ```typescript
   * if (sessionService.hasAccessPolicy('sess_123', AccessPolicy.AccountRead)) {
   *   // Session can read account data
   *   console.log('Access granted');
   * }
   * ```
   */
  public hasAccessPolicy(sessionId: SessionId, accessPolicy: AccessPolicy): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new NotFoundError('SESSION_NOT_FOUND', {});
    }

    if (!session.account) {
      throw new ConflictError('SESSION_HAS_NOT_AUTHORIZED', {});
    }

    const referenceService = this.getService(ReferenceService);
    if (
      referenceService.hasAccessPolicyInSegmentDefinitions(
        accessPolicy,
        session.account.segmentDefinitionIds,
      )
    ) {
      return true;
    }

    if (!session.character) {
      return false;
    }

    return referenceService.hasAccessPolicyInSegmentDefinitions(
      accessPolicy,
      session.character.segmentDefinitionIds,
    );
  }

  @OnServer('playerConnecting')
  private async onPlayerConnecting({ sessionId, ipAddress }: RPPlayerConnecting) {
    try {
      const { token } = await this.getEngineApi(SessionApi).startSession(sessionId, { ipAddress });
      const tokenHash = generateSessionTokenHash(sessionId, token);
      this.sessions.set(sessionId, { id: sessionId, tokenHash });
      this.eventEmitter.emit('sessionStarted', { sessionId, sessionToken: token });
    } catch {
      this.eventEmitter.emit('sessionFinished', {
        sessionId,
        endReason: SessionEndReason.SessionInitFailed,
      });
    }
  }

  @OnServer('playerDisconnected')
  private async onPlayerDisconnected({ sessionId, reason }: RPPlayerDisconnected) {
    await this.getEngineApi(SessionApi).finishSession(sessionId, { endReason: reason });
  }

  @OnServer('socketSessionStarted')
  private async onSocketSessionStarted(payload: SocketSessionStarted) {
    const tokenHash = await this.getTokenHash(payload.id);
    this.sessions.set(payload.id, {
      ...(this.sessions.get(payload.id) ?? { id: payload.id, tokenHash }),
      hash: payload.hash,
    });
  }

  @OnServer('socketSessionFinished')
  private async onSocketSessionFinished(payload: SocketSessionFinished) {
    if (!this.sessions.delete(payload.id)) {
      return;
    }

    this.eventEmitter.emit('sessionFinished', {
      sessionId: payload.id,
      accountId: payload.accountId,
      characterId: payload.characterId,
      endReason: payload.endReason,
      endReasonText: payload.endReasonText,
    });
  }

  @OnServer('socketSessionAuthorized')
  private async onSocketSessionAuthorized(payload: SocketSessionAuthorized) {
    const session = await this.refreshSession(payload.id);
    if (!session?.account) {
      return;
    }

    this.eventEmitter.emit('sessionAuthorized', {
      sessionId: session.id,
      account: session.account,
    });
  }

  @OnServer('socketSessionCharacterLinked')
  private async onSocketSessionCharacterLinked(payload: SocketSessionCharacterLinked) {
    const session = await this.refreshSession(payload.id);
    if (!session?.character) {
      return;
    }

    this.eventEmitter.emit('sessionCharacterLinked', {
      sessionId: session.id,
      account: session.account!,
      character: session.character!,
    });
  }

  @OnServer('socketSessionUpdated')
  private async onSocketSessionUpdated(payload: SocketSessionUpdated) {
    if (payload.hash === this.sessions.get(payload.id)?.hash) {
      return;
    }

    const session = await this.refreshSession(payload.id);
    if (!session) {
      return;
    }

    this.eventEmitter.emit('sessionUpdated', {
      sessionId: session.id,
      account: session.account,
      character: session.character,
    });
  }

  private async refreshSession(sessionId: SessionId): Promise<RPSession | undefined> {
    if (!this.sessions.has(sessionId)) {
      return;
    }

    try {
      const sessionInfo = await this.getEngineApi(SessionApi).getActiveSessionInfo(sessionId);
      this.sessions.set(sessionId, {
        ...(this.sessions.get(sessionId) ?? { id: sessionId }),
        ...sessionInfo,
      });
      return this.sessions.get(sessionId);
    } catch (error) {
      if (error instanceof EngineError && error.statusCode === 404) {
        this.eventEmitter.emit('sessionFinished', {
          sessionId,
          endReason: SessionEndReason.ConnectionDropped,
        });
        this.sessions.delete(sessionId);
      }
    }
  }

  private async getTokenHash(sessionId: SessionId): Promise<string> {
    const tokenHash = this.sessions.get(sessionId)?.tokenHash;
    if (tokenHash) {
      return tokenHash;
    }

    const sessionInfo = await this.getEngineApi(SessionApi).getActiveSessionInfo(sessionId);
    return sessionInfo.tokenHash;
  }
}
