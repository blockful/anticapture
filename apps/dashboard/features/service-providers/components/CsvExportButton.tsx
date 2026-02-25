"use client";

import { Download } from "lucide-react";

import {
  QuarterKey,
  ServiceProvider,
} from "@/features/service-providers/types";

const QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

interface CsvExportButtonProps {
  providers: ServiceProvider[];
  year: number;
}

export const CsvExportButton = ({ providers, year }: CsvExportButtonProps) => {
  const handleExport = () => {
    const headers = ["Name", "Website", "Proposal", "Budget", ...QUARTERS];
    const rows = providers
      .map((p) => {
        const yearData = p.years[year];
        if (!yearData) return null;
        return [
          p.name,
          p.websiteUrl,
          p.proposalUrl ?? "",
          p.budget,
          ...QUARTERS.map((q) => {
            const report = yearData[q];
            return report.status === "published" && report.reportUrl
              ? `Published: ${report.reportUrl}`
              : report.status;
          }),
        ];
      })
      .filter(Boolean) as string[][];

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `service-providers-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="text-secondary hover:text-link flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-colors"
    >
      [DOWNLOAD AS <span className="text-warning font-medium">CSV</span>
      <Download className="size-3" />]
    </button>
  );
};
