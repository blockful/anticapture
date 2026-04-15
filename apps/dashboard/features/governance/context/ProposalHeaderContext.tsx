"use client";

import { createContext, useContext, type ReactNode } from "react";

interface ProposalHeaderState {
  votingPower: string;
  address: string | undefined;
  proposalStatus: string;
  supportValue: number | undefined;
  snapshotLink?: string | null;
  setIsVotingModalOpen: (isOpen: boolean) => void;
}

const ProposalHeaderContext = createContext<ProposalHeaderState | null>(null);

export const useProposalHeaderContext = () => useContext(ProposalHeaderContext);

export const ProposalHeaderProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: ProposalHeaderState;
}) => (
  <ProposalHeaderContext.Provider value={value}>
    {children}
  </ProposalHeaderContext.Provider>
);
