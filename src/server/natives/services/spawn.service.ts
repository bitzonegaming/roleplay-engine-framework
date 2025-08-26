import { RPServerService } from '../../core/server-service';
import { SpawnPoint } from '../entitites/spawn-point';
import { SpawnConfig, PlayerSpawnOptions, SpawnPointData } from '../types/spawn.types';

export abstract class SpawnService extends RPServerService {
  abstract addSpawnPoint(spawnData: SpawnPointData): Promise<string>;
  abstract removeSpawnPoint(spawnId: string): Promise<boolean>;
  abstract getSpawnPoint(spawnId: string): SpawnPoint | undefined;
  abstract getAllSpawnPoints(): SpawnPoint[];
  abstract getRandomSpawnPoint(): SpawnPoint | undefined;
  abstract loadSpawnsFromConfig(config: SpawnConfig): void;
  abstract spawnPlayer(playerId: string, options?: PlayerSpawnOptions): void;
  abstract setAutoSpawn(enabled: boolean): void;
  abstract setAutoSpawnCallback(playerId: string, callback: () => void): void;
  abstract removeAutoSpawnCallback(playerId: string): void;
  abstract forceRespawn(playerId: string): void;
}
