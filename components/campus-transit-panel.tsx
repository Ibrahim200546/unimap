"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeAlert,
  BusFront,
  ExternalLink,
  Gauge,
  LocateFixed,
  MapPinned,
  RefreshCcw,
  Route,
} from "lucide-react";

import CampusTransitLiveMap from "@/components/campus-transit-live-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CampusTransitOption, CampusTransitResponse } from "@/lib/campus-transit";
import type { CampusSite } from "@/lib/campus-sites";
import { estimateOutdoorWalkingTime, haversineDistance } from "@/lib/geo-utils";
import type { Locale } from "@/lib/i18n";
import { text } from "@/lib/i18n";

interface CampusTransitPanelProps {
  locale: Locale;
  campusSites: CampusSite[];
  activeTargetSiteId: string;
  userLat: number | null;
  userLng: number | null;
  onTargetSiteChange: (siteId: string) => void;
}

type SourceChoice = "__user__" | string;

const TRANSIT_COPY = {
  ru: {
    title: "Транспорт между корпусами",
    subtitle:
      "Показываем ближайшие автобусы из InfoBus для выбранного маршрута между корпусами кампуса.",
    from: "Откуда",
    to: "Куда",
    currentLocation: "Текущая геопозиция",
    currentLocationHint: "Использовать точное местоположение студента",
    noGeolocation:
      "Геопозиция пока недоступна. Можно построить маршрут от выбранного корпуса.",
    loading: "Загружаем живые маршруты и ближайшие автобусы...",
    empty: "InfoBus сейчас не вернул подходящих автобусов для этой пары точек.",
    samePoint: "Вы уже рядом с выбранным корпусом. Автобус сейчас не нужен.",
    refresh: "Обновить",
    nearest: "Ближайший автобус",
    options: "Варианты проезда",
    arrivesIn: "Прибудет через",
    noEta: "ETA пока нет",
    walkToStop: "До остановки",
    walkFromStop: "От остановки до корпуса",
    transfers: "Пересадки",
    stops: "Остановок",
    routeToCampus: "Показать корпус",
    openInfobus: "Открыть в InfoBus",
    departureStop: "Посадка",
    arrivalStop: "Выход",
    legs: "Этапы маршрута",
    updated: "Обновлено",
    oneTransfer: "1 пересадка",
    manyTransfers: "пересадки",
    liveMap: "Реалтайм на карте",
    busesNow: "Автобусы рядом сейчас",
    busCount: "на линии",
    selectedRoute: "Выбранный маршрут",
    noBuses: "Для этой линии сейчас нет онлайн-автобусов рядом с вашим маршрутом.",
    distanceToStop: "До посадки",
    speed: "Скорость",
    online: "На линии",
    offline: "Оффлайн",
    chooseRoute: "Нажмите на вариант ниже, чтобы посмотреть живую карту маршрута.",
  },
  kk: {
    title: "Корпустар арасындағы көлік",
    subtitle:
      "Таңдалған кампус бағыты үшін InfoBus деректерінен ең жақын автобустар көрсетіледі.",
    from: "Қайдан",
    to: "Қайда",
    currentLocation: "Ағымдағы геопозиция",
    currentLocationHint: "Студенттің нақты орналасуын пайдалану",
    noGeolocation:
      "Геопозиция әзір қолжетімсіз. Маршрутты таңдалған корпустан бастауға болады.",
    loading: "Тірі маршруттар мен ең жақын автобустар жүктеліп жатыр...",
    empty: "InfoBus бұл екі нүкте үшін қазір лайықты автобус таппады.",
    samePoint: "Сіз таңдалған корпусқа жақынсыз. Автобус қажет емес.",
    refresh: "Жаңарту",
    nearest: "Ең жақын автобус",
    options: "Жол нұсқалары",
    arrivesIn: "Келеді",
    noEta: "ETA жоқ",
    walkToStop: "Аялдамаға дейін",
    walkFromStop: "Аялдамадан корпусқа дейін",
    transfers: "Ауысу",
    stops: "Аялдама",
    routeToCampus: "Корпусты көрсету",
    openInfobus: "InfoBus-та ашу",
    departureStop: "Отыру",
    arrivalStop: "Түсу",
    legs: "Маршрут кезеңдері",
    updated: "Жаңартылды",
    oneTransfer: "1 ауысу",
    manyTransfers: "ауысу",
    liveMap: "Картадағы реалтайм",
    busesNow: "Қазір жақын автобустар",
    busCount: "желіде",
    selectedRoute: "Таңдалған маршрут",
    noBuses: "Бұл бағыт үшін қазір онлайн автобустар көрінбейді.",
    distanceToStop: "Отыруға дейін",
    speed: "Жылдамдық",
    online: "Желіде",
    offline: "Оффлайн",
    chooseRoute: "Төмендегі нұсқаны басып, тірі картаны қараңыз.",
  },
} as const;

function formatMeters(meters: number, _locale: Locale) {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }

  return `${(meters / 1000).toFixed(1)} км`;
}

function formatMinutes(minutes: number | null, locale: Locale) {
  if (minutes === null) return locale === "ru" ? "нет данных" : "дерек жоқ";
  if (minutes < 1) return "< 1 мин";
  return `${Math.round(minutes)} мин`;
}

function formatUpdatedAt(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "kk-KZ", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function formatSpeed(speed: number) {
  return `${Math.max(0, Math.round(speed))} км/ч`;
}

export default function CampusTransitPanel({
  locale,
  campusSites,
  activeTargetSiteId,
  userLat,
  userLng,
  onTargetSiteChange,
}: CampusTransitPanelProps) {
  const copy = TRANSIT_COPY[locale];
  const campusPoints = useMemo(
    () =>
      campusSites.filter(
        (site): site is CampusSite & { lat: number; lng: number } =>
          site.lat !== undefined && site.lng !== undefined
      ),
    [campusSites]
  );
  const [sourceChoice, setSourceChoice] = useState<SourceChoice>(
    userLat !== null && userLng !== null ? "__user__" : campusPoints[0]?.id ?? ""
  );
  const [targetSiteId, setTargetSiteId] = useState(activeTargetSiteId);
  const [data, setData] = useState<CampusTransitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  useEffect(() => {
    setTargetSiteId(activeTargetSiteId);
  }, [activeTargetSiteId]);

  useEffect(() => {
    if (sourceChoice === "__user__" && (userLat === null || userLng === null)) {
      setSourceChoice(campusPoints[0]?.id ?? "");
    }
  }, [campusPoints, sourceChoice, userLat, userLng]);

  const targetSite =
    campusPoints.find((site) => site.id === targetSiteId) ?? campusPoints[0] ?? null;
  const sourceSite =
    sourceChoice !== "__user__"
      ? campusPoints.find((site) => site.id === sourceChoice) ?? null
      : null;
  const sourcePoint =
    sourceChoice === "__user__" && userLat !== null && userLng !== null
      ? { lat: userLat, lng: userLng, label: copy.currentLocation }
      : sourceSite
        ? { lat: sourceSite.lat, lng: sourceSite.lng, label: text(sourceSite.name, locale) }
        : null;

  const samePoint =
    sourcePoint && targetSite
      ? haversineDistance(sourcePoint.lat, sourcePoint.lng, targetSite.lat, targetSite.lng) < 180
      : false;

  useEffect(() => {
    if (!sourcePoint || !targetSite || samePoint) {
      setData(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          sourceLat: sourcePoint.lat.toString(),
          sourceLng: sourcePoint.lng.toString(),
          targetLat: targetSite.lat.toString(),
          targetLng: targetSite.lng.toString(),
        });
        const response = await fetch(`/api/infobus/campus-transit?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Transit fetch failed");
        }

        const payload = (await response.json()) as CampusTransitResponse;
        if (!cancelled) {
          setData(payload);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Transit fetch failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const intervalId = window.setInterval(load, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshNonce, samePoint, sourcePoint?.lat, sourcePoint?.lng, targetSite?.lat, targetSite?.lng]);

  useEffect(() => {
    if (!data?.options.length) {
      setSelectedOptionId(null);
      return;
    }

    setSelectedOptionId((current) => {
      if (current && data.options.some((option) => option.id === current)) {
        return current;
      }

      return data.options[0]?.id ?? null;
    });
  }, [data]);

  const topOption = data?.options[0] ?? null;
  const selectedOption =
    data?.options.find((option) => option.id === selectedOptionId) ?? topOption ?? null;
  const infobusLink =
    sourcePoint && targetSite
      ? `https://infobus.kz/cities/2/pathsbwpoints?sourceLat=${sourcePoint.lat}&sourceLng=${sourcePoint.lng}&targetLat=${targetSite.lat}&targetLng=${targetSite.lng}`
      : "https://infobus.kz/";

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-border bg-background/70 p-4">
        <div className="flex items-start gap-3">
          <BusFront className="mt-0.5 h-5 w-5 text-primary" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{copy.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-background/70 p-4">
        <div className="grid gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.from}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={userLat === null || userLng === null}
                onClick={() => setSourceChoice("__user__")}
                className={[
                  "rounded-full border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                  sourceChoice === "__user__"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted",
                ].join(" ")}
              >
                <LocateFixed className="mr-2 inline h-4 w-4" />
                {copy.currentLocation}
              </button>
              {campusPoints.map((site) => (
                <button
                  key={`source-${site.id}`}
                  type="button"
                  onClick={() => setSourceChoice(site.id)}
                  className={[
                    "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                    sourceChoice === site.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted",
                  ].join(" ")}
                >
                  {text(site.name, locale)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {userLat === null || userLng === null ? copy.noGeolocation : copy.currentLocationHint}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.to}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {campusPoints.map((site) => (
                <button
                  key={`target-${site.id}`}
                  type="button"
                  onClick={() => {
                    setTargetSiteId(site.id);
                    onTargetSiteChange(site.id);
                  }}
                  className={[
                    "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                    targetSiteId === site.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted",
                  ].join(" ")}
                >
                  {text(site.name, locale)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {samePoint ? (
        <section className="rounded-[28px] border border-border bg-background/70 p-4">
          <p className="text-sm text-muted-foreground">{copy.samePoint}</p>
        </section>
      ) : null}

      {loading ? (
        <section className="rounded-[28px] border border-border bg-background/70 p-4">
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-[28px] border border-border bg-background/70 p-4">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </section>
      ) : null}

      {!loading && !error && !samePoint && topOption ? (
        <section className="rounded-[28px] border border-primary/30 bg-primary/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">{copy.nearest}</p>
              <div className="mt-3 flex items-center gap-3">
                <Badge className="rounded-full px-3 py-1 text-sm" variant="secondary">
                  {topOption.firstRouteNumber}
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-foreground">{topOption.firstRouteName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {copy.departureStop}: {topOption.departureStopName}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.arrivesIn}</p>
              <p className="mt-2 text-lg font-semibold">
                {topOption.nextArrivalSeconds !== null
                  ? formatMinutes(topOption.nextArrivalSeconds / 60, locale)
                  : copy.noEta}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-card px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.walkToStop}</p>
              <p className="mt-2 text-sm font-medium">
                {formatMeters(topOption.walkingToStopMeters, locale)} •{" "}
                {formatMinutes(estimateOutdoorWalkingTime(topOption.walkingToStopMeters), locale)}
              </p>
            </div>
            <div className="rounded-2xl bg-card px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.walkFromStop}</p>
              <p className="mt-2 text-sm font-medium">
                {formatMeters(topOption.walkingFromArrivalMeters, locale)} •{" "}
                {formatMinutes(estimateOutdoorWalkingTime(topOption.walkingFromArrivalMeters), locale)}
              </p>
            </div>
            <div className="rounded-2xl bg-card px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.transfers}</p>
              <p className="mt-2 text-sm font-medium">
                {topOption.transfers === 1
                  ? copy.oneTransfer
                  : `${topOption.transfers} ${copy.manyTransfers}`}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && !error && !samePoint && selectedOption ? (
        <section className="rounded-[28px] border border-border bg-background/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.liveMap}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full px-3 py-1 text-sm" variant="secondary">
                  {selectedOption.firstRouteNumber}
                </Badge>
                <p className="text-sm font-semibold text-foreground">{selectedOption.firstRouteName}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {copy.selectedRoute}: {selectedOption.departureStopName} → {selectedOption.arrivalStopName}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.busesNow}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {selectedOption.activeBusCount} {copy.busCount}
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-border">
            <CampusTransitLiveMap locale={locale} option={selectedOption} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => onTargetSiteChange(targetSiteId)}>
              <MapPinned className="h-4 w-4" />
              {copy.routeToCampus}
            </Button>
            <Button asChild type="button">
              <a href={infobusLink} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                {copy.openInfobus}
              </a>
            </Button>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <BadgeAlert className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{copy.busesNow}</h3>
            </div>

            {selectedOption.liveBuses.length ? (
              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                {selectedOption.liveBuses.map((bus) => (
                  <div key={bus.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{bus.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {bus.offline ? copy.offline : copy.online}
                        </p>
                      </div>
                      <Badge variant={bus.offline ? "outline" : "secondary"}>
                        {bus.offline ? copy.offline : copy.online}
                      </Badge>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-foreground/85">
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-primary" />
                          <span>{copy.distanceToStop}</span>
                        </div>
                        <p className="mt-2 font-medium">
                          {formatMeters(bus.distanceToDepartureStopMeters, locale)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-foreground/85">
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-primary" />
                          <span>{copy.speed}</span>
                        </div>
                        <p className="mt-2 font-medium">{formatSpeed(bus.speed)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{copy.noBuses}</p>
            )}
          </div>

          {data ? (
            <p className="mt-4 text-xs text-muted-foreground">
              {copy.updated}: {formatUpdatedAt(data.updatedAt, locale)}
            </p>
          ) : null}
        </section>
      ) : null}

      {!loading && !error && !samePoint && data && data.options.length === 0 ? (
        <section className="rounded-[28px] border border-border bg-background/70 p-4">
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
          <Button asChild className="mt-3" type="button" variant="outline">
            <a href={infobusLink} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              {copy.openInfobus}
            </a>
          </Button>
        </section>
      ) : null}

      {!loading && data?.options?.length ? (
        <section className="rounded-[28px] border border-border bg-background/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{copy.options}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{copy.chooseRoute}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRefreshNonce((value) => value + 1)}
            >
              <RefreshCcw className="h-4 w-4" />
              {copy.refresh}
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {data.options.map((option) => {
              const isSelected = option.id === selectedOption?.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOptionId(option.id)}
                  className={[
                    "w-full rounded-2xl border bg-card p-4 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:bg-muted/50",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{option.firstRouteNumber}</Badge>
                        <p className="text-sm font-semibold text-foreground">{option.firstRouteName}</p>
                        <Badge variant="outline">
                          {option.activeBusCount} {copy.busCount}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {copy.departureStop}: {option.departureStopName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {copy.arrivalStop}: {option.arrivalStopName}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {option.nextArrivalSeconds !== null
                          ? `${copy.arrivesIn} ${formatMinutes(option.nextArrivalSeconds / 60, locale)}`
                          : copy.noEta}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {copy.stops}: {option.totalStops} • {copy.transfers}: {option.transfers}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-foreground/85">
                      {copy.walkToStop}: {formatMeters(option.walkingToStopMeters, locale)}
                    </div>
                    <div className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-foreground/85">
                      {copy.walkFromStop}: {formatMeters(option.walkingFromArrivalMeters, locale)}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.legs}</p>
                    <div className="mt-2 space-y-2">
                      {option.legs.map((leg, index) => (
                        <div
                          key={`${option.id}-leg-${index}`}
                          className="flex items-start gap-3 rounded-2xl bg-muted/60 px-3 py-3"
                        >
                          <Route className="mt-0.5 h-4 w-4 text-primary" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {leg.routeNumber} • {leg.routeName}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {leg.departureStopName} → {leg.arrivalStopName}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {copy.stops}: {leg.stopCount}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
