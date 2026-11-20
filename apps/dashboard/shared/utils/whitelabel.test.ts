import { DaoIdEnum } from "@/shared/types/daos";
import {
  getDaoAddressPath,
  getLegacyProfileRedirectPath,
  getWhitelabelInternalPath,
} from "@/shared/utils/whitelabel";

const ADDRESS = "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5";

describe("getDaoAddressPath", () => {
  it("builds the main app path from a DAO page", () => {
    expect(
      getDaoAddressPath({
        daoId: DaoIdEnum.ENS,
        pathname: "/ens/proposals/1",
        address: ADDRESS,
      }),
    ).toBe(`/ens/address/${ADDRESS}`);
  });

  it("keeps the internal whitelabel prefix", () => {
    expect(
      getDaoAddressPath({
        daoId: DaoIdEnum.ENS,
        pathname: "/whitelabel/ens/delegates",
        address: ADDRESS,
      }),
    ).toBe(`/whitelabel/ens/address/${ADDRESS}`);
  });

  it("drops the DAO prefix on a whitelabel domain", () => {
    expect(
      getDaoAddressPath({
        daoId: DaoIdEnum.ENS,
        pathname: "/proposals",
        address: ADDRESS,
      }),
    ).toBe(`/address/${ADDRESS}`);
  });

  it("falls back to the main app for DAOs without a whitelabel", () => {
    expect(
      getDaoAddressPath({
        daoId: DaoIdEnum.NOUNS,
        pathname: "/",
        address: ADDRESS,
      }),
    ).toBe(`/nouns/address/${ADDRESS}`);
  });
});

describe("getLegacyProfileRedirectPath", () => {
  const params = (query: string) => new URLSearchParams(query);

  it("redirects the drawer query on the main app", () => {
    expect(
      getLegacyProfileRedirectPath({
        pathname: "/ens/stakeholders",
        searchParams: params(`tab=delegates&drawerAddress=${ADDRESS}`),
        whitelabelDaoId: null,
      }),
    ).toBe(`/ens/address/${ADDRESS}`);
  });

  it("redirects the drawer query on the internal whitelabel path", () => {
    expect(
      getLegacyProfileRedirectPath({
        pathname: "/whitelabel/ens/delegates",
        searchParams: params(`drawerAddress=${ADDRESS}`),
        whitelabelDaoId: null,
      }),
    ).toBe(`/whitelabel/ens/address/${ADDRESS}`);
  });

  it("redirects the drawer query on a whitelabel domain", () => {
    expect(
      getLegacyProfileRedirectPath({
        pathname: "/delegates",
        searchParams: params(`drawerAddress=${ADDRESS}`),
        whitelabelDaoId: DaoIdEnum.ENS,
      }),
    ).toBe(`/address/${ADDRESS}`);
  });

  it("redirects the old whitelabel delegate route", () => {
    expect(
      getLegacyProfileRedirectPath({
        pathname: `/delegates/${ADDRESS}`,
        searchParams: params(""),
        whitelabelDaoId: DaoIdEnum.ENS,
      }),
    ).toBe(`/address/${ADDRESS}`);
    expect(
      getLegacyProfileRedirectPath({
        pathname: `/whitelabel/ens/delegates/${ADDRESS}`,
        searchParams: params(""),
        whitelabelDaoId: null,
      }),
    ).toBe(`/whitelabel/ens/address/${ADDRESS}`);
  });

  it("ignores pages that are not legacy profile URLs", () => {
    expect(
      getLegacyProfileRedirectPath({
        pathname: "/ens/stakeholders",
        searchParams: params("tab=delegates"),
        whitelabelDaoId: null,
      }),
    ).toBeNull();
    expect(
      getLegacyProfileRedirectPath({
        pathname: "/whitelabel/ens/delegates",
        searchParams: params(""),
        whitelabelDaoId: null,
      }),
    ).toBeNull();
  });

  it("ignores values that are not addresses", () => {
    expect(
      getLegacyProfileRedirectPath({
        pathname: "/ens/stakeholders",
        searchParams: params("drawerAddress=foo"),
        whitelabelDaoId: null,
      }),
    ).toBeNull();
  });

  it("ignores paths that do not belong to a DAO", () => {
    expect(
      getLegacyProfileRedirectPath({
        pathname: "/alerts",
        searchParams: params(`drawerAddress=${ADDRESS}`),
        whitelabelDaoId: null,
      }),
    ).toBeNull();
  });
});

describe("getWhitelabelInternalPath", () => {
  it("rewrites the address profile on a whitelabel domain", () => {
    expect(
      getWhitelabelInternalPath({
        daoId: DaoIdEnum.ENS,
        pathname: `/address/${ADDRESS}`,
      }),
    ).toBe(`/whitelabel/ens/address/${ADDRESS}`);
  });
});
