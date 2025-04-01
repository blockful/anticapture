"use client";

import Image from "next/image";
import ArbitrumShowSupport from "@/public/show-support/ArbitrumShowSupport.png";
import ArbitrumShowSupportMobile from "@/public/show-support/ArbitrumShowSupportMobile.png";
import ArbitrumSupportedDao from "@/public/show-support/ArbitrumSupportedDao.png";
import ArbitrumSupportedDaoMobile from "@/public/show-support/ArbitrumSupportedDaoMobile.png";
import { ConnectWallet } from "./ConnectWallet";
import { useAccount } from "wagmi";
import { CheckCircle2, Pencil } from "lucide-react";
import Link from "next/link";
import { TwitterIcon } from "./icons/TwitterIcon";
import { TelegramIcon } from "./icons/TelegramIcon";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/lib/types/daos";
import { submitPetitionSignature, usePetitionSignatures } from "@/hooks/usePetition";
import { wagmiConfig } from "@/lib/wallet";
import { signMessage } from "@wagmi/core";

export const CardDaoSignature = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  const { isConnected, address } = useAccount();

  const { data, loading } = usePetitionSignatures(daoIdEnum, address);

  const handleSubmit = async () => {
    if (!address) return;

    const signature = await signMessage(wagmiConfig, {
      account: address,
      message: "I support Arbitrum fully integrated into the Anticapture",
    });

    try {
      await submitPetitionSignature(daoIdEnum, signature, address);
    } catch (error) {
      console.error("Failed to submit signature:", error);
    }
  };

  const isSignedToSupprt: boolean = data?.userSigned || false;
  const isDaoSupported: boolean = false; //TODO: Adjust this to use DAO-SUPPORTEDs

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg text-white sm:flex-row sm:gap-10 sm:border sm:border-lightDark sm:bg-dark sm:p-4">
      <div className="order-1 flex sm:order-none">
        <div className="hidden sm:flex">
          <div className="flex h-[156px] w-[156px] items-center justify-center">
            <Image
              alt={`${isDaoSupported ? "Show Support Arbitrum" : "Dao Supported"}`}
              src={isDaoSupported ? ArbitrumSupportedDao : ArbitrumShowSupport}
              width={156}
              height={156}
              className="h-[156px] w-[156px] flex-shrink-0 object-contain"
              priority
            />
          </div>
        </div>
        <div className="flex w-full rounded-md border border-lightDark bg-dark py-2.5 pl-3.5 pr-[15px] sm:hidden">
          <Image
            alt={`${isDaoSupported ? "Show Support Arbitrum" : "Dao Supported"}`}
            src={
              isDaoSupported
                ? ArbitrumSupportedDaoMobile
                : ArbitrumShowSupportMobile
            }
            objectFit="cover"
          />
        </div>
      </div>
      {!isDaoSupported && (
        <div className="flex w-full flex-col justify-center gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="flex text-[18px] font-medium leading-6 text-[#FAFAFA]">
              Sign to request Arbitrum DAO DATA
            </h3>
            <p className="flex text-sm font-normal text-foreground">
              By signing, we do not collect any information, and the only
              signature involved is related to a message, which carries no risk.
              This helps us understand how many members and delegates are
              interested in the data of a particular DAO. We appreciate your
              support.
            </p>
          </div>
          {!isConnected && (
            <div className="flex">
              <ConnectWallet
                label="Connect Wallet"
                className="!w-fit !bg-[#FAFAFA] !text-dark"
              />
            </div>
          )}
          {isConnected && !isSignedToSupprt && (
            <div className="flex">
              <button
                onClick={handleSubmit}
                className="btn-connect-wallet !w-fit !bg-[#FAFAFA] text-sm font-medium !text-dark"
              >
                <Pencil className="h-4 w-4" />
                Sign to support
              </button>
            </div>
          )}
          {isConnected && isSignedToSupprt && (
            <div className="flex">
              <button className="btn-connect-wallet !w-fit !bg-[#FAFAFA] text-sm font-medium !text-dark">
                <CheckCircle2 className="h-4 w-4" />
                Signed
              </button>
            </div>
          )}
        </div>
      )}
      {isDaoSupported && (
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-300" />
              <h3 className="flex text-[18px] font-medium leading-6 text-[#FAFAFA]">
                Arbitrum DAO support confirmed
              </h3>
            </div>
            <p className="flex text-sm font-normal text-foreground">
              Thanks for your support, it helps us track interest in Arbitrum
              DAO data. No personal information was collected, and the signature
              was only for this request.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="flex text-xs font-semibold uppercase text-foreground">
              Follow anticapture and stay tuned for updates
            </p>
            <div className="flex gap-2.5">
              <Link
                href="https://t.me/anticapture_xyz"
                target="_blank"
                className="flex items-center gap-1 text-tangerine"
              >
                <TelegramIcon />
                Telegram
              </Link>
              <div className="flex h-[75%] border border-white/10" />
              <Link
                href="https://x.com/anticapture_xyz"
                target="_blank"
                className="flex items-center gap-1 text-tangerine"
              >
                <TwitterIcon /> Twitter
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
