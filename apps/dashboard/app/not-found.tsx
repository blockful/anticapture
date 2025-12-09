import Link from "next/link";

const NotFound = () => {
  return (
    <div className="text-primary flex h-screen flex-col items-center justify-center gap-4 bg-blue-500">
      <h2 className="text-2xl font-bold">NotFound</h2>
      <p className="text-center">NotFound</p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-white/10 px-4 py-2 hover:bg-white/20"
      >
        Return Home
      </Link>
    </div>
  );
};

export default NotFound;
