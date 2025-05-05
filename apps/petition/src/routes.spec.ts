import { describe, it, expect, beforeEach, vi } from "vitest";
import fastify from 'fastify';
import { FastifyInstance } from "fastify";
import { PetitionService } from "./services";


describe("Petition Routes", () => {

  let app: FastifyInstance;
  let petitionService: PetitionService;

  beforeEach(() => {
    app = fastify();

  })

  describe("POST /petitions/:daoId", () => {
    it("should sign a petition", () => {

      const supportedDAOs = ["dao1", "dao2"];
    });
  })

});