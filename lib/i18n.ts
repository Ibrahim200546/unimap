export type Locale = "ru" | "kk";

export interface LocalizedText {
  ru: string;
  kk: string;
}

export function text(value: LocalizedText, locale: Locale): string {
  return value[locale];
}
