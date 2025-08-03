import { ReferenceCategory } from '@bitzonegaming/roleplay-engine-sdk';

import { CategoryReferenceId } from '../../domains/reference/models/reference';

import { SocketEvent } from './socket-event';

export interface SocketMetricsUpdated extends SocketEvent {
  id: CategoryReferenceId;
  category: ReferenceCategory;
  referenceId: string;
  keys: string[];
}
