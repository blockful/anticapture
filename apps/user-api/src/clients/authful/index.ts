/**
 * East-west client for Authful's token surface, authenticated with the scoped
 * provisioning key (restricted to `user:*` tenants). Called directly over the
 * private network — never through Gateful.
 */
export type MintedToken = {
  id: string;
  token: string; // plaintext, returned exactly once by Authful
};

export type TokenUsage = {
  id: string;
  lastUsedAt: string | null;
};

export interface AuthfulClient {
  mint(tenant: string, name: string): Promise<MintedToken>;
  revoke(tokenId: string): Promise<void>;
  /** Token metadata for a single tenant (used to surface lastUsedAt). */
  listByTenant(tenant: string): Promise<TokenUsage[]>;
}

export class AuthfulHttpClient implements AuthfulClient {
  constructor(
    private readonly baseUrl: string,
    private readonly provisioningApiKey: string,
  ) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.provisioningApiKey}`,
      "Content-Type": "application/json",
    };
  }

  async mint(tenant: string, name: string): Promise<MintedToken> {
    const res = await fetch(`${this.baseUrl}/tokens`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tenant, name }),
    });
    if (!res.ok) {
      throw new Error(`authful mint failed: ${res.status}`);
    }
    const body = (await res.json()) as { id: string; token: string };
    return { id: body.id, token: body.token };
  }

  async revoke(tokenId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/tokens/${tokenId}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    // 404 means already gone (revoked or never existed) — idempotent success.
    if (!res.ok && res.status !== 404) {
      throw new Error(`authful revoke failed: ${res.status}`);
    }
  }

  async listByTenant(tenant: string): Promise<TokenUsage[]> {
    const res = await fetch(
      `${this.baseUrl}/tokens?tenant=${encodeURIComponent(tenant)}`,
      { headers: this.headers() },
    );
    if (!res.ok) {
      throw new Error(`authful list failed: ${res.status}`);
    }
    const body = (await res.json()) as {
      items: { id: string; lastUsedAt: string | null }[];
    };
    return body.items.map((t) => ({ id: t.id, lastUsedAt: t.lastUsedAt }));
  }
}
