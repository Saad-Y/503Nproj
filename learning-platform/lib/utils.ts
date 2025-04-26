import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";  // ✅ NOT "tailwind-variants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
