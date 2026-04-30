import type { CampusSite } from "@/lib/campus-sites";
import { text, type Locale, type LocalizedText } from "@/lib/i18n";

export type ExternalMapService = "yandex" | "2gis" | "google";
export type GlobalMapProvider = "osm" | "google" | "2gis" | "yandex";
export type OutdoorMapStyle = "auto" | "light" | "dark" | "relief";
export type ResolvedOutdoorMapStyle = Exclude<OutdoorMapStyle, "auto">;

export const OUTDOOR_MAP_STYLE_OPTIONS: Array<{
  id: OutdoorMapStyle;
  label: LocalizedText;
  description: LocalizedText;
}> = [
  {
    id: "auto",
    label: { ru: "Авто", kk: "Авто", en: "Auto" },
    description: {
      ru: "Подстраивается под светлую или тёмную тему приложения.",
      kk: "Қосымшаның жарық не қараңғы тақырыбына сай өзгереді.",
      en: "Follows the application's light or dark theme.",
    },
  },
  {
    id: "light",
    label: { ru: "Светлая", kk: "Жарық", en: "Light" },
    description: {
      ru: "Чистая дневная карта для чтения адресов и точек.",
      kk: "Мекенжайлар мен нүктелерді оқуға ыңғайлы ашық карта.",
      en: "A clean daytime map for reading addresses and points.",
    },
  },
  {
    id: "dark",
    label: { ru: "Тёмная", kk: "Қараңғы", en: "Dark" },
    description: {
      ru: "Контрастная карта для тёмной темы и вечернего использования.",
      kk: "Қараңғы тақырып пен кешкі қолдануға арналған контраст карта.",
      en: "A contrast map for dark theme and evening use.",
    },
  },
  {
    id: "relief",
    label: { ru: "Рельеф", kk: "Рельеф", en: "Relief" },
    description: {
      ru: "Топографическая подложка с рельефом и высотами.",
      kk: "Жер бедері мен биіктік белгілері бар топографиялық карта.",
      en: "A topographic base layer with terrain and elevation.",
    },
  },
];

export const GLOBAL_MAP_PROVIDER_OPTIONS: Array<{
  id: GlobalMapProvider;
  label: LocalizedText;
  description: LocalizedText;
}> = [
  {
    id: "osm",
    label: { ru: "OpenStreetMap", kk: "OpenStreetMap", en: "OpenStreetMap" },
    description: {
      ru: "Открытая подложка по умолчанию с быстрым переключением светлой и тёмной темы.",
      kk: "Жарық және қараңғы тақырыпқа тез ауысатын әдепкі ашық карта қабаты.",
      en: "The default open map layer with fast light and dark theme switching.",
    },
  },
  {
    id: "google",
    label: { ru: "Google Maps", kk: "Google Maps", en: "Google Maps" },
    description: {
      ru: "Глобальная схема Google Maps для основной карты кампуса.",
      kk: "Кампустың негізгі картасына арналған Google Maps ғаламдық схемасы.",
      en: "Google Maps global street layer for the main campus map.",
    },
  },
  {
    id: "2gis",
    label: { ru: "2GIS", kk: "2GIS", en: "2GIS" },
    description: {
      ru: "Городская подложка 2GIS с подробной сеткой улиц.",
      kk: "Көшелер торы толық көрсетілетін 2GIS қала картасы.",
      en: "2GIS city layer with a detailed street grid.",
    },
  },
  {
    id: "yandex",
    label: { ru: "Yandex Maps", kk: "Yandex Maps", en: "Yandex Maps" },
    description: {
      ru: "Подложка Yandex Maps для привычной навигации по городу.",
      kk: "Қала бойынша үйреншікті навигацияға арналған Yandex Maps қабаты.",
      en: "Yandex Maps layer for familiar city navigation.",
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
    label: { ru: "Yandex Maps", kk: "Yandex Maps", en: "Yandex Maps" },
    description: {
      ru: "Открывать точку кампуса во внешнем окне Yandex Maps.",
      kk: "Кампус нүктесін Yandex Maps сыртқы терезесінде ашу.",
      en: "Open the campus point in an external Yandex Maps window.",
    },
  },
  {
    id: "2gis",
    label: { ru: "2GIS", kk: "2GIS", en: "2GIS" },
    description: {
      ru: "Открывать объект через 2GIS с центром на координатах кампуса.",
      kk: "Нысанды 2GIS арқылы кампус координаттарының ортасына ашу.",
      en: "Open the object in 2GIS centered on the campus coordinates.",
    },
  },
  {
    id: "google",
    label: { ru: "Google Maps", kk: "Google Maps", en: "Google Maps" },
    description: {
      ru: "Открывать координаты объекта в Google Maps.",
      kk: "Нысан координаттарын Google Maps ішінде ашу.",
      en: "Open the object's coordinates in Google Maps.",
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
  if (locale === "kk") return `${serviceLabel} ішінде ашу`;
  if (locale === "en") return `Open in ${serviceLabel}`;
  return `Открыть в ${serviceLabel}`;
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
