import { ReferenceCategory } from '@bitzonegaming/roleplay-engine-sdk';

import { CategoryReferenceId } from '../models/reference';

export interface RPSegmentCreated {
  categoryReferenceId: CategoryReferenceId;
  category: ReferenceCategory;
  referenceId: string;
  segmentDefinitionId: string;
}
