export const convertToCSV = (
  datasets: Record<string, { date: string; value: string }[] | undefined>,
  chartConfig: Record<string, { label: string; color: string }>,
) => {
  const labels = Object.keys(datasets);
  const header = ["date", ...labels.map((key) => chartConfig[key].label)];

  const dataByKey = Object.fromEntries(
    labels.map((key) => [
      key,
      Object.fromEntries((datasets[key] ?? []).map((d) => [d.date, d.value])),
    ]),
  );

  const allDates = [
    ...new Set(labels.flatMap((key) => Object.keys(dataByKey[key]))),
  ].sort();

  const rows = allDates.map((date) => {
    const values = labels.map((key) => dataByKey[key][date] ?? "");
    return [date, ...values].join(",");
  });

  return [header.join(","), ...rows].join("\n");
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
