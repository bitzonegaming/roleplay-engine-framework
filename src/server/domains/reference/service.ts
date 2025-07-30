import {
  Metric,
  MetricApi,
  ReferenceApi,
  ReferenceCategory,
  Segment,
} from '@bitzonegaming/roleplay-engine-sdk';

import { RPServerService } from '../../core/server-service';

import {
  CategoryReferenceId,
  CategoryReferenceIdParam,
  getCategoryReferenceId,
  RPReference,
} from './models/reference';
import { MetricId } from './models/metric';

/**
 * Service for managing reference data and metrics in the roleplay server.
 *
 * This service provides functionality for:
 * - Reference data management (accounts, characters, vehicles, etc.)
 * - Metric data retrieval and caching
 * - Segment information management
 * - Bulk data preloading for performance
 *
 * The service maintains local caches of reference data, metrics, and segments
 * that are preloaded during initialization for optimal performance. It supports
 * different reference categories and provides efficient access to related metrics.
 *
 * @example
 * ```typescript
 * // Get metrics for a specific reference
 * const vehicleMetrics = referenceService.getMetrics({
 *   category: ReferenceCategory.Vehicle,
 *   referenceId: 'vehicle_123'
 * });
 * ```
 */
export class ReferenceService extends RPServerService {
  /** Cache of reference data indexed by category reference ID */
  private readonly references: Map<CategoryReferenceId, RPReference> = new Map([]);
  /** Cache of metrics organized by category reference ID and metric ID */
  private readonly metrics: Map<CategoryReferenceId, Map<MetricId, Metric>> = new Map([]);
  /** Cache of segments indexed by category reference ID */
  private readonly segments: Map<CategoryReferenceId, Segment[]> = new Map([]);

  /**
   * Initializes the reference service by preloading references and metrics.
   *
   * This method is called during server startup to populate the local caches
   * with reference data and their associated metrics for optimal performance.
   *
   * @override
   * @returns Promise that resolves when initialization is complete
   */
  public override async init(): Promise<void> {
    this.logger.info('Initializing vehicle references...');
    await this.preloadReferences(ReferenceCategory.Vehicle);
    await this.preloadReferenceMetrics(ReferenceCategory.Vehicle);
    return super.init();
  }

  /**
   * Retrieves all metrics for a specific category reference.
   *
   * Returns a map of metrics associated with the specified category reference ID.
   * Metrics contain detailed information such as values, units, and descriptions
   * for various properties of the reference item.
   *
   * @param categoryReferenceId - The category reference ID (object with category and referenceId, or string)
   * @returns Map of metrics indexed by metric ID, empty map if no metrics found
   */
  public getMetrics(categoryReferenceId: CategoryReferenceIdParam): Map<MetricId, Metric> {
    const catRefId = getCategoryReferenceId(categoryReferenceId);
    return this.metrics.get(catRefId) ?? new Map([]);
  }

  private async loadReferenceSegments(categoryReferenceId: CategoryReferenceIdParam) {
    const catRefId = getCategoryReferenceId(categoryReferenceId);
    this.segments.set(catRefId, await this.getApi(ReferenceApi).getReferenceSegments(catRefId));
  }

  private async loadReferenceMetrics(categoryReferenceId: CategoryReferenceIdParam) {
    const catRefId = getCategoryReferenceId(categoryReferenceId);
    const metrics = await this.getApi(ReferenceApi).getReferenceMetrics(catRefId);

    const metricsMap = new Map<MetricId, Metric>([]);
    metrics.forEach((metric) => {
      metricsMap.set(metric.id, metric);
    });
    this.metrics.set(catRefId, metricsMap);
  }

  private async preloadReferences(category: ReferenceCategory) {
    let pageIndex = 0;
    while (true) {
      const refs = await this.getApi(ReferenceApi).getReferences({
        category,
        enabled: true,
        pageIndex,
        pageSize: 100,
      });

      refs.items.forEach((ref) => this.references.set(ref.id, ref));
      if (refs.pageCount <= pageIndex) {
        break;
      }

      pageIndex++;
    }
  }

  private async preloadReferenceMetrics(category: ReferenceCategory) {
    let pageIndex = 0;
    while (true) {
      const metrics = await this.getApi(MetricApi).getMetrics({
        category,
        pageIndex,
        pageSize: 100,
      });

      metrics.items.forEach((metric) => {
        let catRefMetrics = this.metrics.get(metric.categoryReferenceId);
        if (!catRefMetrics) {
          catRefMetrics = new Map([]);
          this.metrics.set(metric.categoryReferenceId, catRefMetrics);
        }

        catRefMetrics.set(metric.id, metric);
      });

      if (metrics.pageCount <= pageIndex) {
        break;
      }

      pageIndex++;
    }
  }
}
