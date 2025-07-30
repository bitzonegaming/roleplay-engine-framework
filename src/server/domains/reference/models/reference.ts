import { Reference, ReferenceCategory } from '@bitzonegaming/roleplay-engine-sdk';

export type CategoryReferenceId = string;

export type CategoryReferenceIdParam =
  | string
  | { category: ReferenceCategory; referenceId: string };

export interface RPReference extends Reference {
  id: CategoryReferenceId;
}

export function getCategoryReferenceId(data: CategoryReferenceIdParam): CategoryReferenceId {
  if (typeof data === 'string') {
    return data;
  }
  return `${data.category}:${data.referenceId}`;
}
