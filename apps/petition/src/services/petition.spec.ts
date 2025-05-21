import { describe, it, expect, beforeEach, vi } from "vitest";
import { PetitionService } from "./petition";
import { concat, Hex, verifyMessage } from "viem";
import { PetitionSignatureRequest, DAO_ID } from "../types";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const mockDb = {
  newPetitionSignature: vi.fn(),
  getPetitionSignatures: vi.fn(),
};

const mockAnticaptureClient = {
  getSignersVotingPower: vi.fn(),
};

describe("PetitionService", () => {
  let service: PetitionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PetitionService(
      mockDb,
      mockAnticaptureClient
    );
  });

  describe("signPetition", () => {
    it("signs a petition if DAO is supported and signature is valid", async () => {
      const account = privateKeyToAccount(generatePrivateKey())
      const message = "Sign this petition"
      const expected: PetitionSignatureRequest = {
        daoId: DAO_ID.ENS,
        message,
        signature: await account.signMessage({ message }),
        accountId: account.address,
      };

      await expect(service.signPetition(expected)).resolves.toMatchObject(expected);
      expect(mockDb.newPetitionSignature).toHaveBeenCalledWith(expect.objectContaining(expected));
    });

    it("signs a petition if DAO is supported and multisig signature is valid", async () => {
      const acc1 = privateKeyToAccount(generatePrivateKey())
      const acc2 = privateKeyToAccount(generatePrivateKey())
      const message = "Sign this petition"

      const sig1 = await acc1.signMessage({ message })
      const sig2 = await acc2.signMessage({ message })

      const multisigSignature = concat([sig1, sig2])

      const expected: PetitionSignatureRequest = {
        daoId: DAO_ID.ENS,
        message,
        signature: multisigSignature,
        accountId: acc1.address,
      };

      await expect(service.signPetition(expected)).resolves.toMatchObject(expected);
      expect(mockDb.newPetitionSignature).toHaveBeenCalledWith(expect.objectContaining(expected));
    });

    it("throws if signature is invalid", async () => {
      const account = privateKeyToAccount(generatePrivateKey())
      const message = "Sign this petition"
      const expected: PetitionSignatureRequest = {
        daoId: DAO_ID.ENS,
        message,
        signature: await account.signMessage({ message: `invalid message: ${message}` }),
        accountId: account.address,
      };

      await expect(service.signPetition(expected)).rejects.toThrow("Invalid signature");
      expect(mockDb.newPetitionSignature).not.toHaveBeenCalled();
    });

    it("throws if multisig signature is invalid", async () => {
      const acc1 = privateKeyToAccount(generatePrivateKey())
      const acc2 = privateKeyToAccount(generatePrivateKey())
      const message = "Sign this petition"

      const sig1 = await acc1.signMessage({ message })
      const sig2 = await acc2.signMessage({ message })
      const multisigSignature = concat([sig1, sig2])
      const invalidSig = multisigSignature.slice(0, -1) as Hex

      const expected: PetitionSignatureRequest = {
        daoId: DAO_ID.ENS,
        message,
        signature: invalidSig,
        accountId: acc2.address,
      };

      await expect(service.signPetition(expected)).rejects.toThrow("Invalid signature");
      expect(mockDb.newPetitionSignature).not.toHaveBeenCalled();
    });
  });

  describe("readPetitions", () => {
    it("returns petition data and userSigned=true if user signed", async () => {
      const petitions: PetitionSignatureRequest[] = [
        {
          daoId: DAO_ID.ENS,
          message: "Sign this petition",
          signature: "0x123",
          accountId: "0xabc"
        },
        {
          daoId: DAO_ID.ENS,
          message: "Sign this petition",
          signature: "0x123",
          accountId: "0xdef"
        },
      ];
      mockDb.getPetitionSignatures.mockResolvedValue(petitions);
      mockAnticaptureClient.getSignersVotingPower.mockResolvedValue(123n);

      const result = await service.readPetitions(DAO_ID.ENS, "0xabc");
      expect(result.petitionSignatures).toEqual(petitions);
      expect(result.totalSignatures).toBe(2);
      expect(result.totalSignaturesPower).toBe(123n);
      expect(result.latestVoters).toEqual(["0xabc", "0xdef"]);
      expect(result.userSigned).toBe(true);
    });

    it("returns userSigned=false if user did not sign", async () => {
      const petitions = [
        {
          daoId: DAO_ID.ENS,
          message: "Sign this petition",
          signature: "0x123",
          accountId: "0xdef"
        },
      ];
      mockDb.getPetitionSignatures.mockResolvedValue(petitions);
      mockAnticaptureClient.getSignersVotingPower.mockResolvedValue(1n);

      const result = await service.readPetitions(DAO_ID.ENS, "0xabc");
      expect(result.userSigned).toBe(false);
    });
  });
}); 