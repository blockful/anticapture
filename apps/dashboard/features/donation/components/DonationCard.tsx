"use client";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components";
import { DonationCardProps } from "@/features/donation/types";
import { ExternalLink, Copy, Eye, BookOpen, Shield } from "lucide-react";
import Link from "next/link";

export const DonationCard = ({
  title,
  description,
  address,
  ensAddress,
  qrCodeUrl,
  supportedChains = [],
  chainLinks = {},
}: DonationCardProps) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 42) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className="bg-surface-default w-full rounded-none border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-row gap-2">
          <div className="flex-1 space-y-6">
            {/* Title and Description */}
            <div className="mb-4 flex flex-col gap-3">
              <h2 className="text-primary text-xl font-semibold">{title}</h2>
              <p className="text-secondary text-sm">{description}</p>
            </div>
            <div>
              <h3 className="text-secondary mb-4 text-sm">
                As a public good, your support allows us to:
              </h3>
              <ul className="mb-6 space-y-2">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5">
                    <Eye className="text-secondary size-4" />
                  </div>
                  <span className="text-secondary text-sm leading-relaxed">
                    Make DAO security visible, measurable, and accountable.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5">
                    <BookOpen className="text-secondary size-4" />
                  </div>
                  <span className="text-secondary text-sm leading-relaxed">
                    Improve Ethereum's legibility—without compromising credible
                    neutrality.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5">
                    <Shield className="text-secondary size-4" />
                  </div>
                  <span className="text-secondary text-sm leading-relaxed">
                    Push DAOs and the ecosystem to take action.
                  </span>
                </li>
              </ul>
            </div>

            {/* Main Content Area with Flexbox Layout */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
              {/* Left side - Donation Info */}
              <div className="flex-1 space-y-6">
                {/* Supported chains */}
                {supportedChains.length > 0 && (
                  <div>
                    <p className="text-primary !text-alternative-sm mb-3 font-mono font-medium tracking-wider uppercase">
                      Donate Through Any EVM
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {supportedChains.map((chain) => {
                        const chainLink = chainLinks[chain];
                        const BadgeContent = (
                          <Badge
                            variant="outline"
                            className="border-light-dark hover:text-secondary text-primary gap-2 px-2 py-1 text-sm transition-colors"
                          >
                            <ExternalLink className="size-4" />
                            {chain}
                          </Badge>
                        );

                        return chainLink ? (
                          <Link
                            key={chain}
                            href={chainLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            {BadgeContent}
                          </Link>
                        ) : (
                          <div key={chain}>{BadgeContent}</div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Right side - QR Code with Orange Corner Brackets and Gradient */}
          {qrCodeUrl && (
            <div className="mt-6 flex-shrink-0 lg:mt-0">
              <div className="relative">
                {/* Orange corner brackets */}
                <div className="border-tangerine absolute h-4 w-4 border-t-2 border-l-2"></div>
                <div className="border-tangerine absolute -top-0 -right-0 h-4 w-4 border-t-2 border-r-2"></div>
                <div className="border-tangerine absolute -bottom-0 -left-0 h-4 w-4 border-b-2 border-l-2"></div>
                <div className="border-tangerine absolute -right-0 -bottom-0 h-4 w-4 border-r-2 border-b-2"></div>

                {/* QR Code container with gradient background */}
                <div
                  className="border-light-dark gap-3 border p-4"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(236, 118, 46, 0.00) 0%, rgba(236, 118, 46, 0.08) 100%)",
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="mb-3 text-center">
                      <p className="text-secondary text-sm font-normal">
                        Scan the QR code in your wallet app
                      </p>
                    </div>
                    <div className="mx-auto flex h-32 w-32 items-center justify-center bg-white p-2">
                      <img
                        src={qrCodeUrl}
                        alt="Donation QR Code"
                        className="h-full w-full object-contain"
                        style={{ filter: "invert(1)" }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 pt-3">
                    <div className="flex w-full items-center gap-3">
                      <div className="border-light-dark flex-1 border-t"></div>
                      <p className="text-secondary text-sm font-normal">
                        or enter the address
                      </p>
                      <div className="border-light-dark flex-1 border-t"></div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-secondary !text-alternative-xs font-regular font-mono tracking-wide uppercase">
                          ENS Domain
                        </p>
                        <div className="flex items-center gap-1">
                          <code className="text-primary font-mono text-sm">
                            {ensAddress}
                          </code>
                          <button
                            onClick={() => copyToClipboard(ensAddress)}
                            className="text-secondary hover:text-primary flex items-center gap-1 p-1 text-xs transition-colors"
                          >
                            <Copy className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* Address - moved inside QR box */}
                      <div>
                        <p className="text-secondary !text-alternative-xs font-regular font-mono tracking-wide uppercase">
                          Address
                        </p>
                        <div className="flex items-center gap-1">
                          <code className="text-primary font-mono text-sm">
                            {truncateAddress(address)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(address)}
                            className="text-secondary hover:text-primary flex items-center gap-1 p-1 text-xs transition-colors"
                          >
                            <Copy className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
