import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Kombinerer Tailwind klasser med clsx og merger duplikater
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formater dato til norsk format
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "medium",
    ...options,
  }).format(d);
}

/**
 * Formater dato og tid til norsk format
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Relativ tid (f.eks. "for 2 timer siden")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  const intervals = [
    { label: "år", seconds: 31536000 },
    { label: "måned", seconds: 2592000 },
    { label: "uke", seconds: 604800 },
    { label: "dag", seconds: 86400 },
    { label: "time", seconds: 3600 },
    { label: "minutt", seconds: 60 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      const plural = count > 1 && interval.label !== "måned" ? "er" : count > 1 ? "er" : "";
      return `for ${count} ${interval.label}${plural} siden`;
    }
  }
  
  return "akkurat nå";
}

/**
 * Lag en URL-vennlig slug fra en streng
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generer tilfeldig ID
 */
export function generateId(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Forsinke utførelse (for debouncing)
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Valider e-post format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valider norsk telefonnummer
 */
export function isValidNorwegianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  const phoneRegex = /^(\+47)?[2-9]\d{7}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Formater telefonnummer til norsk format
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 10 && cleaned.startsWith("47")) {
    return `+47 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Trunkér tekst med ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

/**
 * Kapitaliser første bokstav
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Hent initialer fra navn
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Formater tall med tusenseparator
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("nb-NO").format(num);
}

/**
 * Kopier tekst til utklippstavle
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sjekk om vi er på klient-siden
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Vent i X millisekunder
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



