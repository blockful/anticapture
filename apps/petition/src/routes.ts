import { z } from "zod";
import { isHex } from "viem";
import { isAddress } from "viem";

import { PetitionService } from "./services";
import { FastifyTypedInstance } from "./types";

interface AnticaptureClient {
  getDAOs: () => Promise<string[]>;
}

export function routes(
  petitionService: PetitionService,
  anticaptureClient: AnticaptureClient
): (app: FastifyTypedInstance) => void {
  return (app: FastifyTypedInstance) => {
    app.post(`/petitions/:daoId`, {
      schema: {
        body: z.object({
          message: z.string(),
          signature: z.string().refine((sig) => isHex(sig), {
            message: "Invalid signature",
          }),
          accountId: z.string().refine((id) => isAddress(id), {
            message: "Invalid account",
          }),
        }),
        params: z.object({
          daoId: z.string(),
        }),
        response: {
          201: z.object({
            message: z.string(),
            signature: z.string().refine((sig) => isHex(sig), {
              message: "Invalid signature",
            }),
            accountId: z.string().refine((id) => isAddress(id), {
              message: "Invalid account",
            }),
            timestamp: z.bigint(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    }, async (request, response) => {
      const petition = request.body;
      const { daoId } = request.params;

      const supportedDAOs = await anticaptureClient.getDAOs();

      if (!supportedDAOs.includes(daoId)) {
        return response.status(400).send({ message: "DAO not supported" });
      }

      const dbPetition = await petitionService.signPetition({
        ...petition,
        daoId
      });

      return response.status(201).send(dbPetition);
    });

    app.get("/petitions/:daoId", {
      schema: {
        params: z.object({
          daoId: z.string(),
        }),
        querystring: z.object({
          userAddress: z.string().refine((addr) => isAddress(addr), {
            message: "Invalid user address",
          }).optional(),
        }),
        response: {
          200: z.object({
            petitionSignatures: z.array(z.object({
              message: z.string(),
              signature: z.string().refine((sig) => isHex(sig), {
                message: "Invalid signature",
              }),
              accountId: z.string().refine((id) => isAddress(id), {
                message: "Invalid account",
              }),
              timestamp: z.bigint(),
            })),
            totalSignatures: z.number(),
            totalSignaturesPower: z.bigint(),
            latestVoters: z.array(z.string()),
            userSigned: z.boolean().optional(),
          })
        }
      }
    }, async (request, response) => {
      const { daoId } = request.params
      const { userAddress } = request.query;
      const petitions = await petitionService.readPetitions(daoId, userAddress)
      return response.status(200).send(petitions)
    });
  }
}

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

