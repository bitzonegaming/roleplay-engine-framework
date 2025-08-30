import { RPServerService } from '../../core/server-service';
import { ServerPlayer } from '../entitites/player';
import { RPSpawnService } from './spawn.service';
import {
  RPPlayerConnecting,
  RPPlayerDisconnected,
  RPPlayerReady,
  RPPlayerJoined,
  RPPlayerLeft,
  RPPlayerDeath,
  RPPlayerSpawn,
} from '../events/player';
import { RPNativeSessionStarted } from '../events/session';
import { RPSpawnFailed, RPSpawnRequest, RPForceRespawn } from '../events/spawn';
import {
  ClientPlayerDiedPayload,
  ClientSpawnRequestPayload,
  ClientSpawnFailedPayload,
} from '../../../shared/events/c2s';
import { ServerTypes } from '../../core/types';

export abstract class RPPlayerService<
  T extends ServerTypes = ServerTypes,
> extends RPServerService<T> {
  // OnClient methods (client events)
  abstract handleClientReady(playerId: string): Promise<void>;
  abstract handleClientDied(playerId: string, payload: ClientPlayerDiedPayload): void;
  abstract handleSpawnRequest(playerId: string, payload: ClientSpawnRequestPayload): void;
  abstract handleForceSpawn(playerId: string): void;
  abstract handleSpawnFailed(playerId: string, payload: ClientSpawnFailedPayload): void;

  // OnServer methods (server events with payloads)
  abstract onPlayerConnecting(payload: RPPlayerConnecting): Promise<void>;
  abstract onSessionStarted(payload: RPNativeSessionStarted): Promise<void>;
  abstract onPlayerDisconnected(payload: RPPlayerDisconnected): Promise<void>;
  abstract onPlayerReady(payload: RPPlayerReady): Promise<void>;
  abstract onPlayerJoined(payload: RPPlayerJoined): Promise<void>;
  abstract onPlayerLeft(payload: RPPlayerLeft): Promise<void>;
  abstract onPlayerDeath(payload: RPPlayerDeath): Promise<void>;
  abstract onPlayerSpawn(payload: RPPlayerSpawn): Promise<void>;
  abstract onSpawnFailed(payload: RPSpawnFailed): Promise<void>;
  abstract onPlayerSpawnRequested(payload: RPSpawnRequest): Promise<void>;
  abstract onForceRespawn(payload: RPForceRespawn): Promise<void>;

  // Utility methods
  abstract getPlayer(id: string): ServerPlayer;
  abstract getSpawnManager(): RPSpawnService;
}
