import Link from "next/link";

export function ElectionBanner() {
  return (
    <Link
      href="/election/ens"
      target="_blank"
      className="block w-full rounded-lg"
    >
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-orange-600 to-orange-800 p-4 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="text-lg font-semibold">ElectionFul</h3>
              <p className="text-sm text-blue-100">
                Participate in the ENS DAO election
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/20">
            View Election
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
