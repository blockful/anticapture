"use client";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components";
import { DonationCardProps } from "@/features/donation/types";
import {
  ExternalLink,
  Copy,
  Eye,
  BookOpen,
  Shield,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shared/components/ui/tooltip";
import Image from "next/image";

export const DonationCard = ({
  title,
  description,
  address,
  ensAddress,
  qrCodeUrl,
  supportedChains = [],
  chainLinks = {},
}: DonationCardProps) => {
  const [copiedEns, setCopiedEns] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyToClipboard = async (text: string, type: "ens" | "address") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "ens") {
        setCopiedEns(true);
        setTimeout(() => setCopiedEns(false), 2000);
      } else {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 42) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className="bg-surface-background md:bg-surface-default w-full rounded-none border-0 shadow-sm">
      <CardContent className="px-0 py-5 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 space-y-6">
            {/* Title and Description */}
            <div className="mb-4 flex flex-col gap-3">
              <h2 className="text-primary text-lg font-medium">{title}</h2>
              <p className="text-secondary text-sm">{description}</p>
            </div>
            <div>
              <h3 className="text-secondary mb-2 text-sm">
                As a public good, your support allows us to:
              </h3>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center gap-3">
                  <div>
                    <Eye className="text-primary size-4" />
                  </div>
                  <span className="text-secondary text-sm leading-relaxed">
                    Make DAO security visible, measurable, and accountable.
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div>
                    <BookOpen className="text-primary size-4" />
                  </div>
                  <span className="text-secondary text-sm leading-relaxed">
                    Improve Ethereum&apos;s legibility—without compromising
                    credible neutrality.
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div>
                    <Shield className="text-primary size-4" />
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
                  <div className="flex flex-col gap-1.5">
                    <p className="text-primary !text-alternative-sm font-mono font-medium uppercase tracking-wider">
                      Donate Through Any EVM
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      {supportedChains.map((chain, index) => {
                        const chainLink = chainLinks[chain];
                        return (
                          <Link
                            key={chain}
                            href={chainLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-block ${index === 0 ? "col-span-2 sm:col-span-1" : ""}`}
                          >
                            <Badge
                              variant="outline"
                              className="bg-surface-default border-middle-dark hover:bg-middle-dark sm:hover:bg-light-dark text-primary w-full items-center justify-center gap-2 px-2 py-1 text-sm font-normal transition-colors sm:w-max sm:bg-transparent"
                            >
                              <ExternalLink className="size-4" />
                              {chain}
                            </Badge>
                          </Link>
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
                <div className="border-tangerine absolute size-4 border-l-2 border-t-2" />
                <div className="border-tangerine absolute -right-0 -top-0 size-4 border-r-2 border-t-2" />
                <div className="border-tangerine absolute -bottom-0 -left-0 size-4 border-b-2 border-l-2" />
                <div className="border-tangerine absolute -bottom-0 -right-0 size-4 border-b-2 border-r-2" />

                {/* QR Code container with gradient background */}
                <div
                  className="border-light-dark gap-3 border p-4"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(236, 118, 46, 0.00) 0%, rgba(236, 118, 46, 0.08) 100%)",
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-center">
                      <p className="text-secondary text-sm font-normal">
                        Scan the QR code in your wallet app
                      </p>
                    </div>
                    <div className="border-light-dark mx-auto flex h-32 w-32 items-center justify-center border bg-transparent p-2">
                      <Image
                        src={qrCodeUrl}
                        alt="Donation QR Code"
                        className="h-full w-full object-contain"
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
                        <p className="text-secondary !text-alternative-xs font-regular font-mono uppercase tracking-wide">
                          ENS Domain
                        </p>
                        <div className="flex items-center gap-1">
                          <code className="text-primary max-w-[300px] truncate font-sans text-sm font-normal">
                            {ensAddress}
                          </code>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  copyToClipboard(ensAddress, "ens")
                                }
                                className="text-secondary hover:text-primary flex items-center gap-1 p-1 text-xs transition-colors"
                              >
                                {copiedEns ? (
                                  <CheckCircle2
                                    strokeWidth={3}
                                    className="size-4"
                                  />
                                ) : (
                                  <Copy className="size-4" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="center"
                              sideOffset={8}
                              className="border-light-dark bg-surface-default text-primary z-50 rounded-lg border p-2 text-sm shadow-sm"
                            >
                              {copiedEns ? "Copied!" : "Copy"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Address - moved inside QR box */}
                      <div>
                        <p className="text-secondary !text-alternative-xs font-mono font-normal uppercase tracking-wide">
                          Address
                        </p>
                        <div className="flex items-center gap-1">
                          <code className="text-primary max-w-[calc(100vw-100px)] truncate font-sans text-sm font-normal">
                            {truncateAddress(address)}
                          </code>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  copyToClipboard(address, "address")
                                }
                                className="text-secondary hover:text-primary flex items-center gap-1 p-1 text-xs transition-colors"
                              >
                                {copiedAddress ? (
                                  <CheckCircle2
                                    strokeWidth={3}
                                    className="size-4"
                                  />
                                ) : (
                                  <Copy className="size-4" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="center"
                              sideOffset={8}
                              className="border-light-dark bg-surface-default text-primary z-50 rounded-lg border p-2 text-sm shadow-sm"
                            >
                              {copiedAddress ? "Copied!" : "Copy"}
                            </TooltipContent>
                          </Tooltip>
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
