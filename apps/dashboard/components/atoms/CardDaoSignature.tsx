"use client";

import Image from "next/image";
import Link from "next/link";
import ArbitrumShowSupport from "@/public/show-support/ArbitrumShowSupport.png";
import ArbitrumShowSupportMobile from "@/public/show-support/ArbitrumShowSupportMobile.png";
import ArbitrumSupportedDao from "@/public/show-support/ArbitrumSupportedDao.png";
import ArbitrumSupportedDaoMobile from "@/public/show-support/ArbitrumSupportedDaoMobile.png";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { ArrowRight, CheckCircle2, Pencil } from "lucide-react";
import { DaoIdEnum } from "@/lib/types/daos";
import {
  submitPetitionSignature,
  usePetitionSignatures,
} from "@/hooks/usePetition";
import { wagmiConfig } from "@/lib/wallet";
import { signMessage } from "@wagmi/core";
import { ConnectWallet } from "@/components/atoms";

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

  const isSignedToSupportDao: boolean = data?.userSigned || false;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg py-8 text-white sm:flex-row sm:gap-10 sm:border sm:border-lightDark sm:bg-lightDark sm:p-4">
      <div className="order-1 flex sm:order-none">
        <div className="hidden sm:flex">
          <div className="flex h-[156px] w-[156px] items-center justify-center">
            <Image
              alt={`${isSignedToSupportDao ? "Show Support Arbitrum" : "Dao Supported"}`}
              src={
                isSignedToSupportDao
                  ? ArbitrumSupportedDao
                  : ArbitrumShowSupport
              }
              width={156}
              height={156}
              className="h-[156px] w-[156px] flex-shrink-0 object-contain"
              priority
            />
          </div>
        </div>
        <div className="flex w-full rounded-md border border-lightDark bg-dark py-2.5 pl-3.5 pr-[15px] sm:hidden">
          <Image
            alt={`${isSignedToSupportDao ? "Show Support Arbitrum" : "Dao Supported"}`}
            src={
              isSignedToSupportDao
                ? ArbitrumSupportedDaoMobile
                : ArbitrumShowSupportMobile
            }
            objectFit="cover"
          />
        </div>
      </div>
      {!isSignedToSupportDao && (
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
                className="!w-fit !border-transparent !bg-[#FAFAFA] py-1 !text-dark !transition-all !duration-1000 !ease-in-out hover:!bg-white/70"
              />
            </div>
          )}
          {isConnected && !isSignedToSupportDao && (
            <div className="flex">
              <button
                onClick={handleSubmit}
                className="btn-connect-wallet !w-fit !border-transparent !bg-[#FAFAFA] text-sm font-medium !text-dark !transition-all !duration-1000 !ease-in-out hover:!bg-white/70"
              >
                <Pencil className="size-4" />
                Sign to support
              </button>
            </div>
          )}
          {isConnected && isSignedToSupportDao && (
            <div className="flex">
              <button className="btn-connect-wallet !w-fit !border-transparent !bg-[#FAFAFA] text-sm font-medium !text-dark !transition-all !duration-1000 !ease-in-out hover:!bg-white/70">
                <CheckCircle2 className="size-4" />
                Signed
              </button>
            </div>
          )}
        </div>
      )}
      {isSignedToSupportDao && (
        <div className="flex w-full flex-col items-center justify-center gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-success" />
              <h3 className="flex text-[18px] font-medium leading-6 text-white">
                Arbitrum DAO support confirmed
              </h3>
            </div>
            <p className="flex text-sm font-normal text-foreground">
              Thanks for your support, it helps us track interest in Arbitrum
              DAO data. No personal information was collected, and the signature
              was only for this request.
            </p>
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <p className="flex text-sm font-semibold text-foreground">
              Want to continue the conversation on governance risks with other
              DAO decision-makers?
            </p>
            <div className="flex gap-1 items-center">
              <a className="link-tangerine text-sm" href="https://t.me/+uZlI0EZS2WM5YzMx" target="_blank">JOIN THE GOVERNANCE SECURITY CIRCLE</a>
              <ArrowRight className="link-tangerine size-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
