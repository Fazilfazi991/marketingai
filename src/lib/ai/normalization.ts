export const normalizeSuggestedTime = (value: string | null | undefined) => {
  const text = value?.trim() || "11:00";
  const twelveHour = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toUpperCase() === "PM") hour += 12;
    return `${String(hour).padStart(2, "0")}:${twelveHour[2] ?? "00"}`;
  }
  const twentyFourHour = text.match(/^([01]?\d|2[0-3])(?::([0-5]\d))?/);
  return twentyFourHour
    ? `${String(Number(twentyFourHour[1])).padStart(2, "0")}:${twentyFourHour[2] ?? "00"}`
    : "11:00";
};
