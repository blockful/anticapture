"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";

interface NotFoundProps {
  reason?: "not_found" | SupportStageEnum.EMPTY_ANALYSIS;
}

export default function NotFound({ reason = "not_found" }: NotFoundProps) {
  const { daoId } = useParams();

  const messages = {
    not_found: {
      title: "Not Found",
      description: `Could not find The ${daoId} DAO`,
    },
    [SupportStageEnum.EMPTY_ANALYSIS]: {
      title: "Coming Soon",
      description: `The ${daoId} DAO is currently under analysis. Check back later for updates.`,
    },
  };

  const { title, description } = messages[reason];

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-white">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-center">{description}</p>
      <Link 
        href="/" 
        className="mt-4 rounded-md bg-white/10 px-4 py-2 hover:bg-white/20"
      >
        Return Home
      </Link>
    </div>
  );
}
