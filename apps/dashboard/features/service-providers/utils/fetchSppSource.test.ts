import {
  fetchSource,
  SERVICE_PROVIDERS_API_PATH,
} from "@/features/service-providers/utils/fetchServiceProvidersData";
import { fetchSppSource } from "@/features/service-providers/utils/fetchSppSource";

const RAW = "https://raw.githubusercontent.com/ensdao/spp/main";
const TREE =
  "https://api.github.com/repos/ensdao/spp/git/trees/main?recursive=1";

const providers = { providers: [{ name: "Provider", slug: "provider" }] };
const programs = { programs: { SPP3: { name: "SPP3", year1Quarters: [] } } };
const tree = {
  tree: [
    { path: "avatars/provider.png", type: "blob" },
    { path: "avatars/nested/skip.png", type: "blob" },
    { path: "avatars", type: "tree" },
    { path: "providers.json", type: "blob" },
  ],
};

const json = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

type Routes = Record<string, () => Response | Promise<Response>>;

const router = (routes: Routes) => {
  const calls: string[] = [];
  const fetchImpl = async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const handler = routes[url];
    if (!handler) throw new TypeError(`Failed to fetch ${url}`);
    return handler();
  };
  return { calls, fetchImpl: fetchImpl as typeof fetch };
};

const github: Routes = {
  [`${RAW}/providers.json`]: () => json(providers),
  [`${RAW}/programs.json`]: () => json(programs),
  [TREE]: () => json(tree),
};

describe("fetchSppSource", () => {
  test("reads both files and maps avatars by provider slug", async () => {
    const { fetchImpl } = router(github);

    await expect(fetchSppSource(fetchImpl)).resolves.toEqual({
      config: providers,
      programsConfig: programs,
      avatarUrls: { provider: `${RAW}/avatars/provider.png` },
    });
  });

  test("fails when a required file is not served", async () => {
    const { fetchImpl } = router({
      ...github,
      [`${RAW}/providers.json`]: () => json(null, 503),
    });

    await expect(fetchSppSource(fetchImpl)).rejects.toThrow(
      "Failed to fetch providers.json: 503",
    );
  });

  test("returns no avatars when the tree request fails", async () => {
    const { fetchImpl } = router({
      ...github,
      [TREE]: () => json(null, 403),
    });

    await expect(fetchSppSource(fetchImpl)).resolves.toMatchObject({
      avatarUrls: {},
    });
  });
});

describe("fetchSource", () => {
  const served = {
    config: providers,
    programsConfig: programs,
    avatarUrls: { provider: `${RAW}/avatars/provider.png` },
  };

  test("uses this app's route and never contacts GitHub from the browser", async () => {
    const { calls, fetchImpl } = router({
      [SERVICE_PROVIDERS_API_PATH]: () => json(served),
    });

    await expect(fetchSource(fetchImpl)).resolves.toEqual(served);
    expect(calls).toEqual([SERVICE_PROVIDERS_API_PATH]);
  });

  test("falls back to GitHub when the route answers with an error", async () => {
    const { calls, fetchImpl } = router({
      ...github,
      [SERVICE_PROVIDERS_API_PATH]: () => json({ error: "upstream" }, 502),
    });

    await expect(fetchSource(fetchImpl)).resolves.toEqual(served);
    expect(calls).toContain(`${RAW}/providers.json`);
  });

  test("fails when neither the route nor GitHub can be reached", async () => {
    const { fetchImpl } = router({});

    await expect(fetchSource(fetchImpl)).rejects.toThrow("Failed to fetch");
  });
});
