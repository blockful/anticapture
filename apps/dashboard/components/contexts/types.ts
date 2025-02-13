import { TimeInterval } from "@/lib/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/lib/server/backend";

export interface TokenDistributionContext {
    days: TimeInterval;
    setDays: (days: TimeInterval) => void;
    totalSupply: {
        value: string | undefined;
        changeRate: string | undefined;
    };
    setTotalSupply: (totalSupply: {
        value: string;
        changeRate: string;
    }) => void;
    totalSupplyChart: DaoMetricsDayBucket[];
    setTotalSupplyChart: (totalSupplyChart: DaoMetricsDayBucket[]) => void;
    circulatingSupply: {
        value: string | undefined;
        changeRate: string | undefined;
    };
    setCirculatingSupply: (circulatingSupply: {
        value: string;
        changeRate: string;
    }) => void;
    circulatingSupplyChart: DaoMetricsDayBucket[];
    setCirculatingSupplyChart: (circulatingSupplyChart: DaoMetricsDayBucket[]) => void;
    delegatedSupply: {
        value: string | undefined;
        changeRate: string | undefined;
    };
    setDelegatedSupply: (delegatedSupply: {
        value: string;
        changeRate: string;
    }) => void;
    delegatedSupplyChart: DaoMetricsDayBucket[];
    setDelegatedSupplyChart: (delegatedSupplyChart: DaoMetricsDayBucket[]) => void;
    cexSupply: {
        value: string | undefined;
        changeRate: string | undefined;
    };
    setCexSupply: (cexSupply: {
        value: string | undefined;
        changeRate: string | undefined;
    }) => void;
    cexSupplyChart: DaoMetricsDayBucket[];
    setCexSupplyChart: (cexSupplyChart: DaoMetricsDayBucket[]) => void;
    dexSupply: {
        value: string | undefined;
        changeRate: string | undefined;
    };
    setDexSupply: (dexSupply: {
        value: string | undefined;
        changeRate: string | undefined;
    }) => void;
    dexSupplyChart: DaoMetricsDayBucket[];
    setDexSupplyChart: (dexSupplyChart: DaoMetricsDayBucket[]) => void;
    lendingSupply: {
        value: string | undefined;
        changeRate: string | undefined;
    };
    setLendingSupply: (lendingSupply: {
        value: string | undefined   ;
        changeRate: string | undefined;
    }) => void;
    lendingSupplyChart: DaoMetricsDayBucket[];
    setLendingSupplyChart: (lendingSupplyChart: DaoMetricsDayBucket[]) => void;
}
