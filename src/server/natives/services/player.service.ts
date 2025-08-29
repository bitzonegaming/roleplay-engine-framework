import { RPServerService } from '../../core/server-service';
import { RPPlayer } from '../entitites/player';
import { SpawnService } from './spawn.service';
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
  ClientPlayerReadyPayload,
  ClientPlayerDiedPayload,
  ClientSpawnRequestPayload,
  ClientForceSpawnPayload,
  ClientSpawnFailedPayload,
} from '../events/c2s';

export abstract class PlayerService extends RPServerService {
  // OnClient methods (client events)
  abstract handleClientReady(payload: ClientPlayerReadyPayload): Promise<void>;
  abstract handleClientDied(payload: ClientPlayerDiedPayload): void;
  abstract handleSpawnRequest(payload: ClientSpawnRequestPayload): void;
  abstract handleForceSpawn(payload: ClientForceSpawnPayload): void;
  abstract handleSpawnFailed(payload: ClientSpawnFailedPayload): void;

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
  abstract getPlayer(id: string): RPPlayer;
  abstract getSpawnManager(): SpawnService;
}
