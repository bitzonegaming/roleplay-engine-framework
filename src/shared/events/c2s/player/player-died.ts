import { Vector3 } from "../../../math";

export interface ClientPlayerDiedPayload {
  playerId: string;
  position: Vector3;
}
