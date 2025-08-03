import { ReferenceCategory } from '@bitzonegaming/roleplay-engine-sdk';

import { CategoryReferenceId } from '../models/reference';

export interface RPSegmentRemoved {
  categoryReferenceId: CategoryReferenceId;
  category: ReferenceCategory;
  referenceId: string;
  segmentDefinitionId: string;
}
