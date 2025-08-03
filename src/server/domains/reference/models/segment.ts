import { SegmentTypeCode } from '@bitzonegaming/roleplay-engine-sdk/segment/models/segment-type';
import { ReferenceCategory } from '@bitzonegaming/roleplay-engine-sdk/reference/models/reference-category';
import { SegmentPolicy } from '@bitzonegaming/roleplay-engine-sdk/segment/models/segment-policy';
import { SegmentStyle } from '@bitzonegaming/roleplay-engine-sdk/segment/models/segment-style';

export type SegmentDefinitionId = string;

export interface RPSegmentDefinition {
  id: string;
  type: SegmentTypeCode;
  category: ReferenceCategory;
  policy: SegmentPolicy;
  style: SegmentStyle;
  visible: boolean;
  createdDate: number;
  lastModifiedDate: number;
}
