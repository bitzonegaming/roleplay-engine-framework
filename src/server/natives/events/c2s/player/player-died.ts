import { Vector3 } from '../../../../../shared';

export interface ClientPlayerDiedPayload {
  playerId: string;
  position: Vector3;
}
