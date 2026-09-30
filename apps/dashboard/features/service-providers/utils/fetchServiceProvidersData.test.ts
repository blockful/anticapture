import type { ProviderEntry } from "@/features/service-providers/types";
import {
  buildProgramData,
  parseProgramConfig,
} from "@/features/service-providers/utils/fetchServiceProvidersData";

const proposal = {
  id: "EP 1.1",
  title: "Proposal",
  date: "2026-01-01",
  forumUrl: "https://discuss.ens.domains/t/1",
  snapshotUrl: "https://snapshot.box/#/s:ens.eth/proposal/0x1",
};

const programConfig = {
  name: "Program",
  year1Quarters: ["2026/Q3", "2026/Q4"],
  budget: 1_000_000,
  startDate: "2026-08-01",
  discussionUrl: "https://discuss.ens.domains/t/1",
  budgetProposal: proposal,
  selectionProposal: proposal,
};

const provider: ProviderEntry = {
  name: "Provider",
  slug: "provider",
  programs: { SPP3: { budget: 100_000, streamDuration: 1 } },
  reports: { "2026/Q4": "https://discuss.ens.domains/t/2" },
};

const oct5 = new Date("2026-10-05T12:00:00Z");

describe("parseProgramConfig", () => {
  test("defaults the report window to 0 days", () => {
    expect(parseProgramConfig(programConfig).reportDueDays).toBe(0);
  });

  test("keeps the program's report window", () => {
    expect(
      parseProgramConfig({ ...programConfig, reportDueDays: 30 }).reportDueDays,
    ).toBe(30);
  });
});

describe("buildProgramData", () => {
  test("uses each program's own report window for the same quarter", () => {
    const quarterEnd = parseProgramConfig(programConfig);
    const thirtyDays = parseProgramConfig({
      ...programConfig,
      reportDueDays: 30,
    });

    expect(
      buildProgramData(quarterEnd, [provider], oct5)[2026].provider.Q3,
    ).toEqual({ status: "overdue" });
    expect(
      buildProgramData(thirtyDays, [provider], oct5)[2026].provider.Q3,
    ).toEqual({ status: "due_soon" });
  });

  test("marks quarters with a report link as published", () => {
    const program = parseProgramConfig({ ...programConfig, reportDueDays: 30 });

    expect(
      buildProgramData(program, [provider], oct5)[2026].provider.Q4,
    ).toEqual({
      status: "published",
      reportUrl: "https://discuss.ens.domains/t/2",
    });
  });
});
