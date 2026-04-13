"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ContractCardProps {
  label: string;
  address: string;
  chainBlockExplorerUrl?: string;
}

export const ContractCard = ({
  label,
  address,
  chainBlockExplorerUrl = "https://etherscan.io",
}: ContractCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = `${chainBlockExplorerUrl}/address/${address}`;

  return (
    <div className="bg-surface-default flex flex-col gap-2 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <p className="text-primary text-xs font-medium">{label}</p>
        <div className="flex items-center gap-1.5">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:text-primary transition-colors"
            aria-label={`View ${label} on block explorer`}
          >
            <ExternalLink className="size-3.5" />
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="text-secondary hover:text-primary cursor-pointer transition-colors"
            aria-label={copied ? "Copied" : `Copy ${label} address`}
          >
            <Copy className="size-3.5" />
          </button>
        </div>
      </div>
      <p className="text-secondary break-all text-sm">{address}</p>
    </div>
  );
};
