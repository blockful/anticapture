interface DaoLayoutProps {
  children: React.ReactNode;
  params: { daoId: string };
}

export default function DaoLayout({ children }: DaoLayoutProps) {
  return (
    <div>
      <div className="z-20 flex w-full items-center justify-center border-b border-b-lightDark bg-dark px-5 shadow-2xl shadow-blue-500/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 text-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-xl font-semibold">Electionful</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/results"
              className="transition-colors hover:text-blue-400"
            >
              Results
            </a>
            <a
              href="/metrics"
              className="transition-colors hover:text-blue-400"
            >
              Metrics
            </a>
            <a href="/vote" className="transition-colors hover:text-blue-400">
              Vote
            </a>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
