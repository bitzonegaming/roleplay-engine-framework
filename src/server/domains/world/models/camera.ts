import { Camera } from '@bitzonegaming/roleplay-engine-sdk';
import { CameraStatic } from '@bitzonegaming/roleplay-engine-sdk/camera/models/camera-static';
import { CameraFollow } from '@bitzonegaming/roleplay-engine-sdk/camera/models/camera-follow';
import { CameraOrbit } from '@bitzonegaming/roleplay-engine-sdk/camera/models/camera-orbit';
import { CameraCinematic } from '@bitzonegaming/roleplay-engine-sdk/camera/models/camera-cinematic';
import { CameraType } from '@bitzonegaming/roleplay-engine-sdk/camera/models/camera';

export type CameraId = string;

export interface RPCamera extends Camera {
  id: CameraId;
  type: CameraType;
  description: string;
  static: CameraStatic | null;
  follow: CameraFollow | null;
  orbit: CameraOrbit | null;
  cinematic: CameraCinematic | null;
  soundId: string | null;
  freezePlayer: boolean;
  hideHud: boolean;
  enabled: boolean;
  createdDate: number;
  lastModifiedDate: number;
}
