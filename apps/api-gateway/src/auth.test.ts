import { IncomingMessage, ServerResponse } from "node:http";

import { validateAuthToken } from "./auth";

const createMockReqRes = (authHeader?: string) => {
  const req = {
    headers: {
      ...(authHeader !== undefined && { authorization: authHeader }),
    },
  } as IncomingMessage;

  const res = {
    writeHead: jest.fn(),
    end: jest.fn(),
  } as unknown as ServerResponse;

  return { req, res };
};

describe("validateAuthToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should allow requests when API_TOKEN is not set", () => {
    delete process.env.API_TOKEN;
    const { req, res } = createMockReqRes();

    expect(validateAuthToken(req, res)).toBe(true);
    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it("should allow requests with a valid Bearer token", () => {
    process.env.API_TOKEN = "secret-123";
    const { req, res } = createMockReqRes("Bearer secret-123");

    expect(validateAuthToken(req, res)).toBe(true);
    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it("should reject requests with an invalid token", () => {
    process.env.API_TOKEN = "secret-123";
    const { req, res } = createMockReqRes("Bearer wrong-token");

    expect(validateAuthToken(req, res)).toBe(false);
    expect(res.writeHead).toHaveBeenCalledWith(401, {
      "Content-Type": "application/json",
    });
    expect(res.end).toHaveBeenCalledWith(
      JSON.stringify({ error: "Unauthorized" }),
    );
  });

  it("should reject requests with no Authorization header", () => {
    process.env.API_TOKEN = "secret-123";
    const { req, res } = createMockReqRes();

    expect(validateAuthToken(req, res)).toBe(false);
    expect(res.writeHead).toHaveBeenCalledWith(401, {
      "Content-Type": "application/json",
    });
  });

  it("should reject requests with a non-Bearer authorization", () => {
    process.env.API_TOKEN = "secret-123";
    const { req, res } = createMockReqRes("Basic secret-123");

    expect(validateAuthToken(req, res)).toBe(false);
    expect(res.writeHead).toHaveBeenCalledWith(401, {
      "Content-Type": "application/json",
    });
  });
});
