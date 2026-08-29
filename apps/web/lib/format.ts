export function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
    .format(date)
    .replace(/\//g, "-");
}

export function classLabel(classLevel: string) {
  const trimmed = classLevel.trim();
  if (!trimmed) return "Class";
  if (/class/i.test(trimmed)) return trimmed;
  return `Class: ${trimmed}`;
}
