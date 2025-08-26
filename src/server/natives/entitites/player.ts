import { Vector3 } from '../math/vector3';
import { BasePlayer } from './base.player';

export abstract class RPPlayer extends BasePlayer {
  constructor(id: string) {
    super(id);
  }

  abstract getPosition(): Vector3;
  abstract setPosition(x: number, y: number, z: number): void;
  abstract get health(): number;
  abstract set health(value: number);
  abstract get name(): string;
  abstract get ip(): string;
  abstract get sessionId(): string | undefined;
  abstract emit(event: string, ...args: any[]): void;
}
