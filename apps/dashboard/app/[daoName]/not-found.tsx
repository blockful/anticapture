"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function NotFound() {
  const { daoName } = useParams();
  return (
    <div className="flex flex-col items-center justify-center text-white">
      <h2>Not Found</h2>
      <p>
        Could not find The <strong>{daoName}</strong> DAO
      </p>
      <Link href="/">Return Home</Link>
    </div>
  );
}
