import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Trim, lowercase, NFKC, strip invisible chars — avoids pasted emails failing auth validation. */
export function normalizeEmailForAuth(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/\uFF20/g, "@")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}
