import { Sound } from '@bitzonegaming/roleplay-engine-sdk';

export type SoundId = string;

export interface RPSound extends Sound {
  id: SoundId;
}
