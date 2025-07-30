/**
 * Tests for ReferenceService
 */
import {
  Metric,
  MetricValueType,
  Reference,
  ReferenceCategory,
  Segment,
  SegmentTypeCode,
} from '@bitzonegaming/roleplay-engine-sdk';

import { RPEventEmitter } from '../../../core/bus/event-emitter';
import { RPHookBus } from '../../../core/bus/hook-bus';
import { MockLogger } from '../../../../test/mocks';
import { RPServerContext } from '../../core/context';
import { RPServerEvents } from '../../core/events/events';
import { RPServerHooks } from '../../core/hooks/hooks';

import { ReferenceService } from './service';
import { getCategoryReferenceId } from './models/reference';

describe('ReferenceService', () => {
  let mockLogger: MockLogger;
  let mockEventEmitter: RPEventEmitter<RPServerEvents>;
  let mockHookBus: RPHookBus<RPServerHooks>;
  let mockContext: RPServerContext;
  let referenceService: ReferenceService;

  // Test data
  const testReferences: Reference[] = [
    {
      id: 'VEHICLE:bmw_x5',
      category: ReferenceCategory.Vehicle,
      categoryName: 'Vehicle',
      referenceId: 'bmw_x5',
      name: 'BMW X5',
      enabled: true,
    },
    {
      id: 'VEHICLE:audi_a4',
      category: ReferenceCategory.Vehicle,
      categoryName: 'Vehicle',
      referenceId: 'audi_a4',
      name: 'Audi A4',
      enabled: true,
    },
    {
      id: 'VEHICLE:ford_f150',
      category: ReferenceCategory.Vehicle,
      categoryName: 'Vehicle',
      referenceId: 'ford_f150',
      name: 'Ford F-150',
      enabled: false,
    },
  ];

  const testMetrics: Metric[] = [
    {
      id: 'metric_1',
      categoryReferenceId: 'VEHICLE:bmw_x5',
      key: 'top_speed',
      valueType: MetricValueType.Number,
      value: 250,
      name: 'Top Speed',
      description: 'Maximum speed in km/h',
    },
    {
      id: 'metric_2',
      categoryReferenceId: 'VEHICLE:bmw_x5',
      key: 'fuel_type',
      valueType: MetricValueType.String,
      value: 'Gasoline',
      name: 'Fuel Type',
      description: 'Type of fuel used',
    },
    {
      id: 'metric_3',
      categoryReferenceId: 'VEHICLE:audi_a4',
      key: 'acceleration',
      valueType: MetricValueType.Number,
      value: 6.8,
      name: 'Acceleration',
      description: '0-100 km/h time in seconds',
    },
    {
      id: 'metric_4',
      categoryReferenceId: 'VEHICLE:audi_a4',
      key: 'has_awd',
      valueType: MetricValueType.Boolean,
      value: true,
      name: 'All Wheel Drive',
      description: 'Whether vehicle has all-wheel drive',
    },
  ];

  const testSegments: Segment[] = [
    {
      id: 'segment_1',
      segmentDefinitionId: 'def_1',
      name: 'Luxury Vehicles',
      type: SegmentTypeCode.Manual,
      typeName: 'Manual',
      category: ReferenceCategory.Vehicle,
      categoryName: 'Vehicle',
      referenceId: 'bmw_x5',
      referenceName: 'BMW X5',
      policy: {
        accessPolicies: [],
        vehicle: {
          maxSpeed: 250,
          category: 'luxury',
        },
      },
      style: {
        color: {
          background: '#FFD700',
          text: '#000000',
        },
      },
      visible: true,
      createdDate: Date.now() - 86400000,
      lastModifiedDate: Date.now() - 3600000,
    },
  ];

  const mockReferenceApi = {
    getReferences: jest.fn(),
    getReferenceMetrics: jest.fn(),
    getReferenceSegments: jest.fn(),
  };

  const mockMetricApi = {
    getMetrics: jest.fn(),
  };

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockEventEmitter = new RPEventEmitter<RPServerEvents>();
    mockHookBus = new RPHookBus<RPServerHooks>();

    // Reset mocks before each test
    mockReferenceApi.getReferences.mockResolvedValue({
      items: testReferences.filter((r) => r.enabled),
      pageIndex: 0,
      pageSize: 100,
      pageCount: 0,
      totalCount: 2,
    });
    mockReferenceApi.getReferenceMetrics.mockResolvedValue([]);
    mockReferenceApi.getReferenceSegments.mockResolvedValue(testSegments);
    mockMetricApi.getMetrics.mockResolvedValue({
      items: testMetrics,
      pageIndex: 0,
      pageSize: 100,
      pageCount: 0,
      totalCount: 4,
    });

    mockContext = {
      logger: mockLogger,
      eventEmitter: mockEventEmitter,
      hookBus: mockHookBus,
      getApi: jest.fn().mockImplementation((apiType) => {
        if (apiType.name === 'ReferenceApi') {
          return mockReferenceApi;
        }
        if (apiType.name === 'MetricApi') {
          return mockMetricApi;
        }
        return {};
      }),
      getService: jest.fn(),
    } as unknown as RPServerContext;

    referenceService = new ReferenceService(mockContext);
  });

  describe('init', () => {
    it('should initialize vehicle references and metrics', async () => {
      await referenceService.init();

      expect(mockContext.getApi).toHaveBeenCalledTimes(2);
      expect(mockReferenceApi.getReferences).toHaveBeenCalledWith({
        category: ReferenceCategory.Vehicle,
        enabled: true,
        pageIndex: 0,
        pageSize: 100,
      });
      expect(mockMetricApi.getMetrics).toHaveBeenCalledWith({
        category: ReferenceCategory.Vehicle,
        pageIndex: 0,
        pageSize: 100,
      });
    });

    it('should log initialization step', async () => {
      const infoSpy = jest.spyOn(mockLogger, 'info');

      await referenceService.init();

      expect(infoSpy).toHaveBeenCalledWith('Initializing vehicle references...');
    });

    it('should handle multiple pages of references', async () => {
      const page1References = [testReferences[0]];
      const page2References = [testReferences[1]];

      // Clear all previous calls and set up fresh mocks
      mockReferenceApi.getReferences.mockClear();
      mockMetricApi.getMetrics.mockClear();

      mockReferenceApi.getReferences
        .mockResolvedValueOnce({
          items: page1References,
          pageIndex: 0,
          pageSize: 1,
          pageCount: 1,
          totalCount: 2,
        })
        .mockResolvedValueOnce({
          items: page2References,
          pageIndex: 1,
          pageSize: 1,
          pageCount: 1,
          totalCount: 2,
        });

      mockMetricApi.getMetrics.mockResolvedValue({
        items: testMetrics,
        pageIndex: 0,
        pageSize: 100,
        pageCount: 0,
        totalCount: 4,
      });

      // Create a fresh service to avoid interference from beforeEach
      const freshService = new ReferenceService(mockContext);
      await freshService.init();

      expect(mockReferenceApi.getReferences).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple pages of metrics', async () => {
      const page1Metrics = [testMetrics[0], testMetrics[1]];
      const page2Metrics = [testMetrics[2], testMetrics[3]];

      // Clear all previous calls and set up fresh mocks
      mockReferenceApi.getReferences.mockClear();
      mockMetricApi.getMetrics.mockClear();

      mockReferenceApi.getReferences.mockResolvedValue({
        items: testReferences.filter((r) => r.enabled),
        pageIndex: 0,
        pageSize: 100,
        pageCount: 0,
        totalCount: 2,
      });

      mockMetricApi.getMetrics
        .mockResolvedValueOnce({
          items: page1Metrics,
          pageIndex: 0,
          pageSize: 2,
          pageCount: 1,
          totalCount: 4,
        })
        .mockResolvedValueOnce({
          items: page2Metrics,
          pageIndex: 1,
          pageSize: 2,
          pageCount: 1,
          totalCount: 4,
        });

      // Create a fresh service to avoid interference from beforeEach
      const freshService = new ReferenceService(mockContext);
      await freshService.init();

      expect(mockMetricApi.getMetrics).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMetrics', () => {
    beforeEach(async () => {
      await referenceService.init();
    });

    it('should return metrics for existing category reference ID using string format', () => {
      const categoryReferenceId = 'VEHICLE:bmw_x5';
      const result = referenceService.getMetrics(categoryReferenceId);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get('metric_1')).toEqual(testMetrics[0]);
      expect(result.get('metric_2')).toEqual(testMetrics[1]);
    });

    it('should return metrics for existing category reference ID using object format', () => {
      const categoryReferenceId = {
        category: ReferenceCategory.Vehicle,
        referenceId: 'audi_a4',
      };
      const result = referenceService.getMetrics(categoryReferenceId);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get('metric_3')).toEqual(testMetrics[2]);
      expect(result.get('metric_4')).toEqual(testMetrics[3]);
    });

    it('should return empty map for non-existing category reference ID', () => {
      const categoryReferenceId = 'VEHICLE:non_existing';
      const result = referenceService.getMetrics(categoryReferenceId);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should handle different metric value types correctly', () => {
      const bmwMetrics = referenceService.getMetrics('VEHICLE:bmw_x5');
      const audiMetrics = referenceService.getMetrics('VEHICLE:audi_a4');

      const topSpeedMetric = bmwMetrics.get('metric_1');
      const fuelTypeMetric = bmwMetrics.get('metric_2');
      const accelerationMetric = audiMetrics.get('metric_3');
      const awdMetric = audiMetrics.get('metric_4');

      expect(topSpeedMetric?.valueType).toBe(MetricValueType.Number);
      expect(topSpeedMetric?.value).toBe(250);

      expect(fuelTypeMetric?.valueType).toBe(MetricValueType.String);
      expect(fuelTypeMetric?.value).toBe('Gasoline');

      expect(accelerationMetric?.valueType).toBe(MetricValueType.Number);
      expect(accelerationMetric?.value).toBe(6.8);

      expect(awdMetric?.valueType).toBe(MetricValueType.Boolean);
      expect(awdMetric?.value).toBe(true);
    });

    it('should maintain separate metric maps for different category references', () => {
      const bmwMetrics = referenceService.getMetrics('VEHICLE:bmw_x5');
      const audiMetrics = referenceService.getMetrics('VEHICLE:audi_a4');

      expect(bmwMetrics.size).toBe(2);
      expect(audiMetrics.size).toBe(2);

      // Verify they contain different metrics
      expect(bmwMetrics.has('metric_1')).toBe(true);
      expect(bmwMetrics.has('metric_3')).toBe(false);
      expect(audiMetrics.has('metric_3')).toBe(true);
      expect(audiMetrics.has('metric_1')).toBe(false);
    });
  });

  describe('getCategoryReferenceId helper function', () => {
    it('should return string as-is when passed string', () => {
      const result = getCategoryReferenceId('VEHICLE:test_vehicle');
      expect(result).toBe('VEHICLE:test_vehicle');
    });

    it('should generate category reference ID from object', () => {
      const result = getCategoryReferenceId({
        category: ReferenceCategory.Vehicle,
        referenceId: 'test_vehicle',
      });
      expect(result).toBe('VEHICLE:test_vehicle');
    });

    it('should handle different reference categories', () => {
      const vehicleResult = getCategoryReferenceId({
        category: ReferenceCategory.Vehicle,
        referenceId: 'my_car',
      });
      const accountResult = getCategoryReferenceId({
        category: ReferenceCategory.Account,
        referenceId: 'my_account',
      });
      const characterResult = getCategoryReferenceId({
        category: ReferenceCategory.Character,
        referenceId: 'my_character',
      });

      expect(vehicleResult).toBe('VEHICLE:my_car');
      expect(accountResult).toBe('ACCOUNT:my_account');
      expect(characterResult).toBe('CHARACTER:my_character');
    });
  });

  describe('private methods behavior', () => {
    it('should properly organize metrics by category reference ID during preload', async () => {
      // Test with metrics that have same categoryReferenceId
      const duplicateMetrics = [
        ...testMetrics,
        {
          id: 'metric_5',
          categoryReferenceId: 'VEHICLE:bmw_x5',
          key: 'engine_size',
          valueType: MetricValueType.Number,
          value: 3.0,
          name: 'Engine Size',
          description: 'Engine displacement in liters',
        } as Metric,
      ];

      mockMetricApi.getMetrics.mockResolvedValue({
        items: duplicateMetrics,
        pageIndex: 0,
        pageSize: 100,
        pageCount: 0,
        totalCount: 5,
      });

      await referenceService.init();

      const bmwMetrics = referenceService.getMetrics('VEHICLE:bmw_x5');
      expect(bmwMetrics.size).toBe(3); // Should have 3 metrics for BMW X5
      expect(bmwMetrics.has('metric_5')).toBe(true);
    });

    it('should handle empty API responses gracefully', async () => {
      mockReferenceApi.getReferences.mockResolvedValue({
        items: [],
        pageIndex: 0,
        pageSize: 100,
        pageCount: 0,
        totalCount: 0,
      });
      mockMetricApi.getMetrics.mockResolvedValue({
        items: [],
        pageIndex: 0,
        pageSize: 100,
        pageCount: 0,
        totalCount: 0,
      });

      await referenceService.init();

      const result = referenceService.getMetrics('VEHICLE:any_vehicle');
      expect(result.size).toBe(0);
    });

    it('should stop pagination when reaching the last page', async () => {
      // Clear all previous calls and set up fresh mocks
      mockReferenceApi.getReferences.mockClear();
      mockMetricApi.getMetrics.mockClear();

      mockReferenceApi.getReferences.mockResolvedValue({
        items: testReferences.slice(0, 1),
        pageIndex: 0,
        pageSize: 100,
        pageCount: 0, // pageCount <= pageIndex, should stop
        totalCount: 1,
      });

      mockMetricApi.getMetrics.mockResolvedValue({
        items: testMetrics,
        pageIndex: 0,
        pageSize: 100,
        pageCount: 0,
        totalCount: 4,
      });

      // Create a fresh service to avoid interference from beforeEach
      const freshService = new ReferenceService(mockContext);
      await freshService.init();

      expect(mockReferenceApi.getReferences).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle API errors during reference preloading', async () => {
      mockReferenceApi.getReferences.mockRejectedValue(new Error('API Error'));

      await expect(referenceService.init()).rejects.toThrow('API Error');
    });

    it('should handle API errors during metric preloading', async () => {
      mockMetricApi.getMetrics.mockRejectedValue(new Error('Metric API Error'));

      await expect(referenceService.init()).rejects.toThrow('Metric API Error');
    });
  });

  describe('performance and caching', () => {
    beforeEach(async () => {
      await referenceService.init();
    });

    it('should return consistent results for repeated calls', () => {
      const categoryReferenceId = 'VEHICLE:bmw_x5';
      const result1 = referenceService.getMetrics(categoryReferenceId);
      const result2 = referenceService.getMetrics(categoryReferenceId);

      expect(result1).toBe(result2); // Should return same Map instance
      expect(result1.size).toBe(result2.size);
    });

    it('should handle large numbers of metrics efficiently', async () => {
      // Generate a large number of metrics
      const largeMetricSet: Metric[] = [];
      for (let i = 0; i < 1000; i++) {
        largeMetricSet.push({
          id: `metric_${i}`,
          categoryReferenceId: 'VEHICLE:test_vehicle',
          key: `test_key_${i}`,
          valueType: MetricValueType.Number,
          value: i,
        });
      }

      mockMetricApi.getMetrics.mockResolvedValue({
        items: largeMetricSet,
        pageIndex: 0,
        pageSize: 1000,
        pageCount: 0,
        totalCount: 1000,
      });

      // Reinitialize with large dataset
      const newService = new ReferenceService(mockContext);
      await newService.init();

      const startTime = Date.now();
      const result = newService.getMetrics('VEHICLE:test_vehicle');
      const endTime = Date.now();

      expect(result.size).toBe(1000);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });
  });
});
