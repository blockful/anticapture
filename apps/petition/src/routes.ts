import { z } from "zod";
import { isHex } from "viem";
import { isAddress } from "viem";

import { PetitionService } from "./services";
import { DAO_ID, FastifyTypedInstance } from "./types";
import { caseInsensitiveEnum } from "./middlewares/enum";

export function routes(
  petitionService: PetitionService,
): (app: FastifyTypedInstance) => void {
  return (app: FastifyTypedInstance) => {
    app.post(`/petitions/{daoId}`, {
      schema: {
        operationId: "signPetition",
        tags: ["Petition"],
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
          daoId: caseInsensitiveEnum(DAO_ID),
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

      try {
        const dbPetition = await petitionService.signPetition({
          ...petition,
          daoId
        });

        return response.status(201).send(dbPetition);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("duplicate key value violates")) {
            return response.status(400).send({ message: "Unable to sign petition" });
          }
          if (error.message.includes("invalid signature")) {
            return response.status(400).send({ message: "Invalid signature" });
          }
        }
        return response.status(500).send({ message: "Internal server error" });
      }
    });

    app.get("/petitions/{daoId}", {
      schema: {
        operationId: "readPetitions",
        tags: ["Petition"],
        params: z.object({
          daoId: caseInsensitiveEnum(DAO_ID),
        }),
        querystring: z.object({
          userAddress: z.string().refine((addr) => addr && isAddress(addr), {
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

