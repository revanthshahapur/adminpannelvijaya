import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const INR_SYMBOL = "\u20B9";

export function formatINR(
  amount: number,
  options?: Omit<Intl.NumberFormatOptions, "style" | "currency">
) {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(normalizedAmount);
}
