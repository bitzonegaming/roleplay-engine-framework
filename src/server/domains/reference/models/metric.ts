import { Metric } from '@bitzonegaming/roleplay-engine-sdk';

import { CategoryReferenceId } from './reference';

export type MetricId = string;

export type RPMetric = Metric & {
  id: MetricId;
  categoryReferenceId: CategoryReferenceId;
};
