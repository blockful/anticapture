"use client";

import Image from "next/image";
import ArbitrumShowSupport from "@/public/show-support/ArbitrumShowSupport.png";
import ArbitrumShowSupportMobile from "@/public/show-support/ArbitrumShowSupportMobile.png";
import ArbitrumSupportedDao from "@/public/show-support/ArbitrumSupportedDao.png";
import ArbitrumSupportedDaoMobile from "@/public/show-support/ArbitrumSupportedDaoMobile.png";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Pencil } from "lucide-react";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  PetitionResponse,
  submitPetitionSignature,
} from "@/features/show-support/hooks/usePetition";
import { wagmiConfig } from "@/shared/services/wallet/wallet";
import { signMessage } from "@wagmi/core";
import { ConnectWallet } from "@/shared/components";
import { Address } from "viem";

//TODO: Change this card to be more generic and use the daoId to determine the images and texts
export const CardDaoSignature = ({
  data,
  loading,
  isConnected,
  address,
  refreshData,
}: {
  data: PetitionResponse | null;
  loading: boolean;
  isConnected: boolean;
  address: Address | undefined;
  refreshData: () => void;
}) => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  const handleSubmit = async () => {
    if (!address) return;

    const signature = await signMessage(wagmiConfig, {
      account: address,
      message: "I support Arbitrum fully integrated into the Anticapture",
    });

    try {
      await submitPetitionSignature(daoIdEnum, signature, address);
      await refreshData();
    } catch (error) {
      console.error("Failed to submit signature:", error);
    }
  };

  const isSignedToSupportDao: boolean = data?.userSigned || false;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="sm:border-light-dark sm:bg-light-dark flex w-full flex-col gap-6 rounded-lg py-8 text-white sm:flex-row sm:gap-10 sm:border sm:p-4">
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
              className="h-[156px] w-[156px] shrink-0 object-contain"
            />
          </div>
        </div>
        <div className="border-light-dark bg-dark flex w-full rounded-md border py-2.5 pr-[15px] pl-3.5 sm:hidden">
          <Image
            alt={`${isSignedToSupportDao ? "Show Support Arbitrum" : "Dao Supported"}`}
            src={
              isSignedToSupportDao
                ? ArbitrumSupportedDaoMobile
                : ArbitrumShowSupportMobile
            }
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>
      {!isSignedToSupportDao && (
        <div className="flex w-full flex-col justify-center gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="flex text-[18px] leading-6 font-medium text-white">
              Sign to request Arbitrum DAO DATA
            </h3>
            <p className="text-foreground flex text-sm font-normal">
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
                className="text-dark! w-fit! border-transparent! bg-[#FAFAFA]! py-1 transition-all! duration-1000! ease-in-out! hover:bg-white/70!"
              />
            </div>
          )}
          {isConnected && !isSignedToSupportDao && (
            <div className="flex">
              <button
                onClick={handleSubmit}
                className="btn-connect-wallet text-dark! w-fit! border-transparent! bg-[#FAFAFA]! text-sm font-medium transition-all! duration-1000! ease-in-out! hover:bg-white/70!"
              >
                <Pencil className="size-4" />
                Sign to support
              </button>
            </div>
          )}
          {isConnected && isSignedToSupportDao && (
            <div className="flex">
              <button className="btn-connect-wallet text-dark! w-fit! border-transparent! bg-[#FAFAFA]! text-sm font-medium transition-all! duration-1000! ease-in-out! hover:bg-white/70!">
                <CheckCircle2 className="size-4" />
                Signed
              </button>
            </div>
          )}
        </div>
      )}
      {isSignedToSupportDao && (
        <div className="flex w-full flex-col justify-center gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-5" />
              <h3 className="flex text-[18px] leading-6 font-medium text-white">
                Arbitrum DAO support confirmed
              </h3>
            </div>
            <p className="text-foreground flex text-sm font-normal">
              Thanks for your support, it helps us track interest in Arbitrum
              DAO data. No personal information was collected, and the signature
              was only for this request.
            </p>
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <p className="text-foreground flex text-sm font-semibold">
              Want to continue the conversation on governance risks with other
              DAO decision-makers?
            </p>
            <div className="flex items-center gap-1">
              <a
                className="link-tangerine text-sm"
                href="https://t.me/+uZlI0EZS2WM5YzMx"
                target="_blank"
              >
                JOIN THE GOVERNANCE SECURITY CIRCLE
              </a>
              <ArrowRight className="link-tangerine size-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
