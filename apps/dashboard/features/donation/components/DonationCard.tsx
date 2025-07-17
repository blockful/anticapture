"use client";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components";
import { DonationCardProps } from "@/features/donation/types";
import { ExternalLink, Copy, Eye, BookOpen, Shield } from "lucide-react";

interface ExtendedDonationCardProps extends DonationCardProps {
  benefits?: string[];
}

export const DonationCard = ({
  title,
  description,
  address,
  ensAddress,
  qrCodeUrl,
  supportedChains = [],
  chainLinks = {},
  benefits = [],
}: ExtendedDonationCardProps) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 42) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className="bg-surface-default w-full border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="space-y-6">
          {/* Title and Description */}
          <div>
            <h2 className="text-primary mb-3 text-xl font-semibold">{title}</h2>
            <p className="text-secondary mb-4 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Benefits Section - Integrated */}
          {benefits.length > 0 && (
            <div>
              <h3 className="text-primary mb-4 text-base font-medium">
                As a public good, your support allows us to:
              </h3>
              <ul className="mb-6 space-y-2">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1.5">
                      {index === 0 && <Eye className="text-primary h-4 w-4" />}
                      {index === 1 && (
                        <BookOpen className="text-primary h-4 w-4" />
                      )}
                      {index === 2 && (
                        <Shield className="text-primary h-4 w-4" />
                      )}
                    </div>
                    <span className="text-secondary text-sm leading-relaxed">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Content Area with Flexbox Layout */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
            {/* Left side - Donation Info */}
            <div className="flex-1 space-y-6">
              {/* Supported chains */}
              {supportedChains.length > 0 && (
                <div>
                  <p className="text-primary !text-alternative-sm mb-3 font-mono font-medium tracking-wide uppercase">
                    Donate Through Any EVM
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {supportedChains.map((chain) => {
                      const chainLink = chainLinks[chain];
                      const BadgeContent = (
                        <Badge
                          variant="outline"
                          className="border-secondary/30 hover:border-secondary/50 px-3 py-1 text-xs transition-colors"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          {chain}
                        </Badge>
                      );

                      return chainLink ? (
                        <a
                          key={chain}
                          href={chainLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          {BadgeContent}
                        </a>
                      ) : (
                        <div key={chain}>{BadgeContent}</div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right side - QR Code with Orange Corner Brackets and Gradient */}
            {qrCodeUrl && (
              <div className="mt-6 flex-shrink-0 lg:mt-0">
                <div className="relative">
                  {/* Orange corner brackets */}
                  <div className="border-tangerine absolute -top-2 -left-2 h-4 w-4 border-t-2 border-l-2"></div>
                  <div className="border-tangerine absolute -top-2 -right-2 h-4 w-4 border-t-2 border-r-2"></div>
                  <div className="border-tangerine absolute -bottom-2 -left-2 h-4 w-4 border-b-2 border-l-2"></div>
                  <div className="border-tangerine absolute -right-2 -bottom-2 h-4 w-4 border-r-2 border-b-2"></div>

                  {/* QR Code container with gradient background */}
                  <div
                    className="border-secondary/20 rounded-lg border p-4"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(236, 118, 46, 0.00) 0%, rgba(236, 118, 46, 0.08) 100%)",
                    }}
                  >
                    <div className="mb-3 text-center">
                      <p className="text-secondary text-xs">
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
                    <div className="mt-3 text-center">
                      <p className="text-secondary text-xs">
                        or enter the address
                      </p>
                    </div>

                    {/* ENS Domain - moved inside QR box */}
                    {ensAddress && (
                      <div className="mt-4">
                        <p className="text-primary !text-alternative-sm mb-2 font-mono font-medium tracking-wide uppercase">
                          ENS Domain
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="bg-surface-background text-primary px-3 py-2 font-mono text-xs">
                            {ensAddress}
                          </code>
                          <button
                            onClick={() => copyToClipboard(ensAddress)}
                            className="text-secondary hover:text-primary flex items-center gap-1 p-1 text-xs transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Address - moved inside QR box */}
                    <div className="mt-4">
                      <p className="text-primary !text-alternative-sm mb-2 font-mono font-medium tracking-wide uppercase">
                        Address
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="bg-surface-background text-primary px-3 py-2 font-mono text-xs">
                          {truncateAddress(address)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(address)}
                          className="text-secondary hover:text-primary flex items-center gap-1 p-1 text-xs transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
