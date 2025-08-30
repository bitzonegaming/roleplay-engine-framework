import { RPServerService } from '../../core/server-service';
import { SpawnPoint } from '../entitites/spawn-point';
import { SpawnConfig, PlayerSpawnOptions, SpawnPointData } from '../types/spawn.types';
import { ServerTypes } from '../../core/types';

export abstract class RPSpawnService<
  T extends ServerTypes = ServerTypes,
> extends RPServerService<T> {
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
