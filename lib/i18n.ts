export type Locale = "ru" | "kk" | "en";

export interface LocalizedText {
  ru: string;
  kk: string;
  en?: string;
}

export function text(value: LocalizedText, locale: Locale): string {
  return value[locale] ?? value.ru ?? value.kk;
}

export function getDateTimeLocale(locale: Locale) {
  if (locale === "kk") return "kk-KZ";
  if (locale === "en") return "en-US";
  return "ru-RU";
}
