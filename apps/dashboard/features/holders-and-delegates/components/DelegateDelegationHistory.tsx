import { DaoIdEnum } from "@/shared/types/daos";

interface DelegateDelegationHistoryProps {
  accountId: string;
  daoId: DaoIdEnum;
}

export const DelegateDelegationHistory = ({
  accountId,
  daoId,
}: DelegateDelegationHistoryProps) => {
  // TODO: Implement actual delegation history data fetching
  const mockData = [
    {
      id: "1",
      date: "2024-01-15",
      action: "Delegated to",
      delegate: "0x1234...5678",
      amount: "1,000 tokens",
    },
    {
      id: "2",
      date: "2024-01-10",
      action: "Redelegated from",
      delegate: "0x9876...5432",
      amount: "1,000 tokens",
    },
  ];

  return (
    <div className="bg-surface-default h-full p-4">
      <div className="space-y-4">
        {mockData.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-secondary text-sm">
              No delegation history found
            </p>
          </div>
        ) : (
          mockData.map((item) => (
            <div
              key={item.id}
              className="border-b border-white/10 pb-4 last:border-b-0"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary text-sm font-medium">
                    {item.action}
                  </p>
                  <p className="text-secondary text-xs">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-mono text-sm">
                    {item.delegate}
                  </p>
                  <p className="text-secondary text-xs">{item.amount}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
