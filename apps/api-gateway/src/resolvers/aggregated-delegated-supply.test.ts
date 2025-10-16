import {
  aggregateMeanPercentage,
  buildPaginatedResponse,
  DelegationPercentageResponse,
} from './aggregated-delegated-supply';

describe('aggregateMeanPercentage', () => {
  it('should calculate mean percentage when DAOs have same dates', () => {
    const daoResponses = new Map<string, DelegationPercentageResponse>([
      [
        'ENS',
        {
          items: [
            { date: '1600041600', high: '50000000000000000000' }, // 50%
            { date: '1600128000', high: '60000000000000000000' }, // 60%
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
          },
        },
      ],
      [
        'UNI',
        {
          items: [
            { date: '1600041600', high: '40000000000000000000' }, // 40%
            { date: '1600128000', high: '50000000000000000000' }, // 50%
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
          },
        },
      ],
    ]);

    const result = aggregateMeanPercentage(daoResponses);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      date: '1600041600',
      high: '45000000000000000000', // (50 + 40) / 2 = 45%
    });
    expect(result[1]).toEqual({
      date: '1600128000',
      high: '55000000000000000000', // (60 + 50) / 2 = 55%
    });
  });

  it('should perform outer join when DAOs have different dates', () => {
    const daoResponses = new Map<string, DelegationPercentageResponse>([
      [
        'ENS',
        {
          items: [
            { date: '1600041600', high: '50000000000000000000' }, // 50%
            { date: '1600128000', high: '60000000000000000000' }, // 60%
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
          },
        },
      ],
      [
        'UNI',
        {
          items: [
            { date: '1600128000', high: '40000000000000000000' }, // 40%
            { date: '1600214400', high: '30000000000000000000' }, // 30%
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
          },
        },
      ],
    ]);

    const result = aggregateMeanPercentage(daoResponses);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      date: '1600041600',
      high: '50000000000000000000', // only ENS
    });
    expect(result[1]).toEqual({
      date: '1600128000',
      high: '50000000000000000000', // (60 + 40) / 2 = 50%
    });
    expect(result[2]).toEqual({
      date: '1600214400',
      high: '30000000000000000000', // only UNI
    });
  });

  it('should handle empty DAO responses', () => {
    const daoResponses = new Map<string, DelegationPercentageResponse>([
      [
        'ENS',
        {
          items: [],
          totalCount: 0,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
          },
        },
      ],
      [
        'UNI',
        {
          items: [{ date: '1600041600', high: '50000000000000000000' }],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
          },
        },
      ],
    ]);

    const result = aggregateMeanPercentage(daoResponses);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: '1600041600',
      high: '50000000000000000000',
    });
  });

  it('should ignore items with empty high value', () => {
    const daoResponses = new Map<string, DelegationPercentageResponse>([
      [
        'ENS',
        {
          items: [
            { date: '1600041600', high: '50000000000000000000' },
            { date: '1600128000', high: '' }, // empty
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
          },
        },
      ],
      [
        'UNI',
        {
          items: [
            { date: '1600041600', high: '40000000000000000000' },
            { date: '1600128000', high: '60000000000000000000' },
          ],
          totalCount: 2,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
          },
        },
      ],
    ]);

    const result = aggregateMeanPercentage(daoResponses);

    expect(result).toHaveLength(2);
    expect(result[0].high).toBe('45000000000000000000'); // (50 + 40) / 2
    expect(result[1].high).toBe('60000000000000000000'); // only UNI counted
  });

  it('should correctly convert bigint with 18 decimals', () => {
    const daoResponses = new Map<string, DelegationPercentageResponse>([
      [
        'ENS',
        {
          items: [
            { date: '1600041600', high: '12345678901234567890' }, // 12.345678901234567890%
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
          },
        },
      ],
      [
        'UNI',
        {
          items: [
            { date: '1600041600', high: '23456789012345678901' }, // 23.456789012345678901%
          ],
          totalCount: 1,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
          },
        },
      ],
    ]);

    const result = aggregateMeanPercentage(daoResponses);

    expect(result).toHaveLength(1);
    expect(result[0].high).toBe('17901233956790122496');
  });

  it('should sort results by date in ascending order', () => {
    const daoResponses = new Map<string, DelegationPercentageResponse>([
      [
        'ENS',
        {
          items: [
            { date: '1600214400', high: '30000000000000000000' },
            { date: '1600041600', high: '10000000000000000000' },
            { date: '1600128000', high: '20000000000000000000' },
          ],
          totalCount: 3,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: null,
            startCursor: null,
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
    const result = buildPaginatedResponse([], {});

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.pageInfo.hasPreviousPage).toBe(false);
    expect(result.pageInfo.endCursor).toBeNull();
    expect(result.pageInfo.startCursor).toBeNull();
  });

  it('should apply desc ordering', () => {
    const items = [
      { date: '1', high: '10' },
      { date: '2', high: '20' },
      { date: '3', high: '30' },
    ];

    const result = buildPaginatedResponse(items, { orderDirection: 'desc' });

    expect(result.items[0].date).toBe('3');
    expect(result.items[1].date).toBe('2');
    expect(result.items[2].date).toBe('1');
  });

  it('should apply pagination and detect hasNextPage', () => {
    const items = [
      { date: '1', high: '10' },
      { date: '2', high: '20' },
      { date: '3', high: '30' },
    ];

    const result = buildPaginatedResponse(items, { limit: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.items[0].date).toBe('1');
    expect(result.items[1].date).toBe('2');
  });

  it('should set correct cursors in pageInfo', () => {
    const items = [
      { date: '100', high: '10' },
      { date: '200', high: '20' },
      { date: '300', high: '30' },
    ];

    const result = buildPaginatedResponse(items, {});

    expect(result.pageInfo.startCursor).toBe('100');
    expect(result.pageInfo.endCursor).toBe('300');
  });

  it('should set hasPreviousPage when after or before is provided', () => {
    const items = [{ date: '1', high: '10' }];

    const resultWithAfter = buildPaginatedResponse(items, { after: '0' });
    expect(resultWithAfter.pageInfo.hasPreviousPage).toBe(true);

    const resultWithBefore = buildPaginatedResponse(items, { before: '2' });
    expect(resultWithBefore.pageInfo.hasPreviousPage).toBe(true);

    const resultWithoutCursor = buildPaginatedResponse(items, {});
    expect(resultWithoutCursor.pageInfo.hasPreviousPage).toBe(false);
  });

  it('should combine ordering and pagination', () => {
    const items = [
      { date: '1', high: '10' },
      { date: '2', high: '20' },
      { date: '3', high: '30' },
      { date: '4', high: '40' },
    ];

    const result = buildPaginatedResponse(items, {
      orderDirection: 'desc',
      limit: 2,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].date).toBe('4'); // desc order
    expect(result.items[1].date).toBe('3');
    expect(result.pageInfo.hasNextPage).toBe(true);
  });
});
