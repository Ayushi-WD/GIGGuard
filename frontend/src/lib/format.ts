export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function formatINR(
  value: number | string,
  options: { decimals?: number } = {},
) {
  const amount = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(amount)) {
    return "—";
  }

  const decimals = options.decimals ?? 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatSignedINR(value: number | string, decimals = 2) {
  const amount = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(amount)) {
    return "—";
  }

  if (amount === 0) {
    return formatINR(0, { decimals });
  }

  const formatted = formatINR(Math.abs(amount), { decimals });
  return `${amount > 0 ? "+" : "−"}${formatted}`;
}

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", options).format(date);
}

export function formatExperience(days: number) {
  if (!Number.isFinite(days) || days < 0) {
    return "—";
  }

  if (days < 30) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "month" : "months"}`;
  }

  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return `${years} ${years === 1 ? "yr" : "yrs"}${
    months ? ` ${months} mo` : ""
  }`;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}
