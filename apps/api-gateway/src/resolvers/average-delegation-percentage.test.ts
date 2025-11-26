import {
  aggregateMeanPercentage,
  buildPaginatedResponse,
  DelegationPercentageResponse,
} from './average-delegation-percentage';

describe('aggregateMeanPercentage', () => {
  it('should calculate mean percentage when DAOs have same dates', () => {
    const daoResponses = new Map<string, DelegationPercentageResponse>([
      [
        'ENS',
        {
          items: [
            { date: '1600041600', high: '50.00' }, // 50%
            { date: '1600128000', high: '60.00' }, // 60%
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endDate: null,
            startDate: null,
          },
        },
      ],
      [
        'UNI',
        {
          items: [
            { date: '1600041600', high: '40.00' }, // 40%
            { date: '1600128000', high: '50.00' }, // 50%
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endDate: null,
            startDate: null,
          },
        },
      ],
    ]);

    const result = aggregateMeanPercentage(daoResponses);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      date: '1600041600',
      high: '45.00', // (50 + 40) / 2 = 45%
    });
    expect(result[1]).toEqual({
      date: '1600128000',
      high: '55.00', // (60 + 50) / 2 = 55%
    });
  });

  it('should return empty when no DAOs have data', () => {
    const daoResponses = new Map<string, DelegationPercentageResponse>();

    const result = aggregateMeanPercentage(daoResponses);

    expect(result).toHaveLength(0);
  });

  it('should correctly calculate mean with decimal precision', () => {
    const daoResponses = new Map<string, DelegationPercentageResponse>([
      [
        'ENS',
        {
          items: [
            { date: '1600041600', high: '12.35' }, // 12.35%
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endDate: null,
            startDate: null,
          },
        },
      ],
      [
        'UNI',
        {
          items: [
            { date: '1600041600', high: '23.46' }, // 23.46%
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endDate: null,
            startDate: null,
          },
        },
      ],
    ]);

    const result = aggregateMeanPercentage(daoResponses);

    expect(result).toHaveLength(1);
    expect(result[0].high).toBe('17.91'); // (12.35 + 23.46) / 2 = 17.905 → 17.91
  });

  it('should preserve order from input (no sorting)', () => {
    const daoResponses = new Map<string, DelegationPercentageResponse>([
      [
        'ENS',
        {
          items: [
            { date: '1600041600', high: '10.00' },
            { date: '1600128000', high: '20.00' },
            { date: '1600214400', high: '30.00' },
          ],
          totalCount: 3,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endDate: null,
            startDate: null,
          },
        },
      ],
    ]);

    const result = aggregateMeanPercentage(daoResponses);

    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('1600041600');
    expect(result[1].date).toBe('1600128000');
    expect(result[2].date).toBe('1600214400');
  });
});

describe('buildPaginatedResponse', () => {
  it('should return empty response when items is empty', () => {
    const result = buildPaginatedResponse([], {}, false);

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.pageInfo.hasPreviousPage).toBe(false);
    expect(result.pageInfo.endDate).toBeNull();
    expect(result.pageInfo.startDate).toBeNull();
  });

  it('should preserve order from input (items already ordered by indexers)', () => {
    // Items come pre-ordered from indexers (desc in this case)
    const items = [
      { date: '3', high: '30' },
      { date: '2', high: '20' },
      { date: '1', high: '10' },
    ];

    const result = buildPaginatedResponse(items, { orderDirection: 'desc' }, false);

    // Should maintain the order received (no re-ordering)
    expect(result.items[0].date).toBe('3');
    expect(result.items[1].date).toBe('2');
    expect(result.items[2].date).toBe('1');
  });

  it('should use hasNextPage from DAOs and apply limit', () => {
    const items = [
      { date: '1', high: '10' },
      { date: '2', high: '20' },
      { date: '3', high: '30' },
    ];

    const result = buildPaginatedResponse(items, { limit: 2 }, true);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].date).toBe('1');
    expect(result.items[1].date).toBe('2');
    expect(result.pageInfo.hasNextPage).toBe(true);
  });

  it('should set correct dates in pageInfo', () => {
    const items = [
      { date: '100', high: '10' },
      { date: '200', high: '20' },
      { date: '300', high: '30' },
    ];

    const result = buildPaginatedResponse(items, {}, false);

    expect(result.pageInfo.startDate).toBe('100');
    expect(result.pageInfo.endDate).toBe('300');
  });

  it('should combine limit and hasNextPage from DAOs', () => {
    // Items come pre-ordered from indexers (desc in this example)
    const items = [
      { date: '4', high: '40' },
      { date: '3', high: '30' },
      { date: '2', high: '20' },
      { date: '1', high: '10' },
    ];

    const result = buildPaginatedResponse(items, {
      orderDirection: 'desc',
      limit: 2,
    }, true);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].date).toBe('4'); // maintains input order
    expect(result.items[1].date).toBe('3');
    expect(result.pageInfo.hasNextPage).toBe(true);
  });

  it('should calculate hasPreviousPage correctly', () => {
    const items = [
      { date: '1', high: '10' },
      { date: '2', high: '20' },
      { date: '3', high: '30' },
    ];

    // No pagination - hasPreviousPage should be false
    const result1 = buildPaginatedResponse(items, {
      startDate: '1',
      after: undefined,
    }, false);
    expect(result1.pageInfo.hasPreviousPage).toBe(false);

    // Paginated forward but after === startDate - hasPreviousPage should be false
    const result2 = buildPaginatedResponse(items, {
      startDate: '1',
      after: '1',
    }, false);
    expect(result2.pageInfo.hasPreviousPage).toBe(false);

    // Paginated forward and after !== startDate - hasPreviousPage should be true
    const result3 = buildPaginatedResponse(items, {
      startDate: '1',
      after: '2',
    }, false);
    expect(result3.pageInfo.hasPreviousPage).toBe(true);
  });
});

