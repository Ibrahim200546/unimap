import type { CampusSite } from "@/lib/campus-sites";
import { text, type Locale, type LocalizedText } from "@/lib/i18n";

export type ExternalMapService = "yandex" | "2gis" | "google";
export type OutdoorMapStyle = "auto" | "light" | "dark" | "relief";
export type ResolvedOutdoorMapStyle = Exclude<OutdoorMapStyle, "auto">;

export const OUTDOOR_MAP_STYLE_OPTIONS: Array<{
  id: OutdoorMapStyle;
  label: LocalizedText;
  description: LocalizedText;
}> = [
  {
    id: "auto",
    label: { ru: "Авто", kk: "Авто" },
    description: {
      ru: "Подстраивается под светлую или тёмную тему приложения.",
      kk: "Қосымшаның жарық не қараңғы тақырыбына сай өзгереді.",
    },
  },
  {
    id: "light",
    label: { ru: "Светлая", kk: "Жарық" },
    description: {
      ru: "Чистая дневная карта для чтения адресов и точек.",
      kk: "Мекенжайлар мен нүктелерді оқуға ыңғайлы ашық карта.",
    },
  },
  {
    id: "dark",
    label: { ru: "Тёмная", kk: "Қараңғы" },
    description: {
      ru: "Контрастная карта для тёмной темы и вечернего использования.",
      kk: "Қараңғы тақырып пен кешкі қолдануға арналған контраст карта.",
    },
  },
  {
    id: "relief",
    label: { ru: "Рельеф", kk: "Рельеф" },
    description: {
      ru: "Топографическая подложка с рельефом и высотами.",
      kk: "Жер бедері мен биіктік белгілері бар топографиялық карта.",
    },
  },
];

export const EXTERNAL_MAP_SERVICE_OPTIONS: Array<{
  id: ExternalMapService;
  label: LocalizedText;
  description: LocalizedText;
}> = [
  {
    id: "yandex",
    label: { ru: "Yandex Maps", kk: "Yandex Maps" },
    description: {
      ru: "Открывать точку кампуса во внешнем окне Yandex Maps.",
      kk: "Кампус нүктесін Yandex Maps сыртқы терезесінде ашу.",
    },
  },
  {
    id: "2gis",
    label: { ru: "2GIS", kk: "2GIS" },
    description: {
      ru: "Открывать объект через 2GIS с центром на координатах кампуса.",
      kk: "Нысанды 2GIS арқылы кампус координаттарының ортасына ашу.",
    },
  },
  {
    id: "google",
    label: { ru: "Google Maps", kk: "Google Maps" },
    description: {
      ru: "Открывать координаты объекта в Google Maps.",
      kk: "Нысан координаттарын Google Maps ішінде ашу.",
    },
  },
];

export function getExternalMapServiceLabel(service: ExternalMapService, locale: Locale) {
  return text(
    EXTERNAL_MAP_SERVICE_OPTIONS.find((option) => option.id === service)?.label ?? EXTERNAL_MAP_SERVICE_OPTIONS[0].label,
    locale
  );
}

export function getOpenInLabel(service: ExternalMapService, locale: Locale) {
  const serviceLabel = getExternalMapServiceLabel(service, locale);
  return locale === "ru" ? `Открыть в ${serviceLabel}` : `${serviceLabel} ішінде ашу`;
}

export function getExternalMapUrl(site: CampusSite, service: ExternalMapService, locale: Locale) {
  if (site.lat === undefined || site.lng === undefined) return null;

  const encodedQuery = encodeURIComponent(`${text(site.name, locale)}, ${text(site.address, locale)}`);
  const lat = site.lat.toFixed(6);
  const lng = site.lng.toFixed(6);

  if (service === "google") {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  if (service === "2gis") {
    return `https://2gis.kz/search/${encodedQuery}?m=${lng}%2C${lat}%2F17`;
  }

  return `https://yandex.kz/maps/?ll=${lng}%2C${lat}&pt=${lng},${lat},pm2rdm&z=17`;
}
