export function parseMoney(value: string) {
  let trimmed = value.trim().replace(/€/g, "").replace(/\s/g, "");

  if (!trimmed) return null;

  if (trimmed.includes(",") && trimmed.includes(".")) {
    trimmed = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (trimmed.includes(",")) {
    trimmed = trimmed.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    trimmed = trimmed.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return "invalid" as const;

  return Number(trimmed);
}
