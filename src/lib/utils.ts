import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function splitMessageContent(content: string) {
  const csvRegex = /(?:^|\n)(Date,Day,Time,.*(?:\n[^,]*(?:,[^,\n]*)*)*)/;
  const match = csvRegex.exec(content);

  if (!match) {
    return {
      text: content,
      csv: null,
    };
  }

  const csv = match[1];
  const text = content.replace(csv!, "").trim();

  return {
    text,
    csv,
  };
}
