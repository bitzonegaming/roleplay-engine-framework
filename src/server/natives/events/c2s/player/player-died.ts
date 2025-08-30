import { Vector3 } from '../../../../../core/math';

export interface ClientPlayerDiedPayload {
  playerId: string;
  position: Vector3;
}
