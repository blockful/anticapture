import { TimeInterval } from "@/lib/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/lib/server/backend";

export interface TokenDistributionContext {
    days: TimeInterval;
    setDays: (days: TimeInterval) => void;
    totalSupply: {
        value: string;
        changeRate: string;
    };
    setTotalSupply: (totalSupply: {
        value: string;
        changeRate: string;
    }) => void;
    totalSupplyChart: DaoMetricsDayBucket[];
    setTotalSupplyChart: (totalSupplyChart: DaoMetricsDayBucket[]) => void;
    circulatingSupply: {
        value: string;
        changeRate: string;
    };
    setCirculatingSupply: (circulatingSupply: {
        value: string;
        changeRate: string;
    }) => void;
    circulatingSupplyChart: DaoMetricsDayBucket[];
    setCirculatingSupplyChart: (circulatingSupplyChart: DaoMetricsDayBucket[]) => void;
    delegatedSupply: {
        value: string;
        changeRate: string;
    };
    setDelegatedSupply: (delegatedSupply: {
        value: string;
        changeRate: string;
    }) => void;
    delegatedSupplyChart: DaoMetricsDayBucket[];
    setDelegatedSupplyChart: (delegatedSupplyChart: DaoMetricsDayBucket[]) => void;
    cexSupply: {
        value: string;
        changeRate: string;
    };
    setCexSupply: (cexSupply: {
        value: string;
        changeRate: string;
    }) => void;
    cexSupplyChart: DaoMetricsDayBucket[];
    setCexSupplyChart: (cexSupplyChart: DaoMetricsDayBucket[]) => void;
    dexSupply: {
        value: string;
        changeRate: string;
    };
    setDexSupply: (dexSupply: {
        value: string;
        changeRate: string;
    }) => void;
    dexSupplyChart: DaoMetricsDayBucket[];
    setDexSupplyChart: (dexSupplyChart: DaoMetricsDayBucket[]) => void;
    lendingSupply: {
        value: string;
        changeRate: string;
    };
    setLendingSupply: (lendingSupply: {
        value: string;
        changeRate: string;
    }) => void;
    lendingSupplyChart: DaoMetricsDayBucket[];
    setLendingSupplyChart: (lendingSupplyChart: DaoMetricsDayBucket[]) => void;
}
