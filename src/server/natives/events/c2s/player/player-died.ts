import { Vector3 } from '../../../math/vector3';

export interface ClientPlayerDiedPayload {
  playerId: string;
  position: Vector3;
}
