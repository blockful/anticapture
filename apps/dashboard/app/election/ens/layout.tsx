import Link from "next/link";

interface DaoLayoutProps {
  children: React.ReactNode;
  params: { daoId: string };
}

export default function DaoLayout({ children }: DaoLayoutProps) {
  return (
    <div>
      <div className="z-20 flex w-full items-center justify-center border-b border-b-lightDark bg-dark px-5 shadow-xl shadow-dark">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 text-gray-100">
          <Link href="/election/ens" className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-xl font-semibold">Electionful</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/election/ens/results"
              className="transition-colors hover:text-blue-400"
            >
              Results
            </Link>
            <Link
              href="/election/ens/metrics"
              className="transition-colors hover:text-blue-400"
            >
              Metrics
            </Link>
            <Link
              href="/election/ens/vote"
              className="transition-colors hover:text-blue-400"
            >
              Vote
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
