export const timestampToReadableDate = (
  date: number,
  format: "abbreviated" | "full" | "day_abbreviated" = "full",
) => {
  if (isNaN(date) || date === null || date === undefined) return "Invalid Date";

  let dateStr = date.toString();

  while (dateStr.length < 13) {
    dateStr += "0";
  }

  while (dateStr.length > 13) {
    dateStr = (Number(dateStr) / 10).toFixed(0);
  }

  const timestamp = Number(dateStr);

  const newDate = new Date(timestamp);
  if (isNaN(newDate.getTime())) return "Invalid Date";

  const month = newDate.toLocaleDateString("en-US", { month: "short" });
  const year = newDate.toLocaleDateString("en-US", { year: "2-digit" });

  return format === "abbreviated"
    ? `${month} '${year}`
    : format === "day_abbreviated"
      ? `${newDate.getDate()}. ${month}`
      : newDate.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
};
