"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  Bell,
  BookOpenText,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe2,
  LocateFixed,
  Map,
  Moon,
  PanelsTopLeft,
  Route,
  Settings2,
  Sparkles,
  SunMedium,
} from "lucide-react";
import { useTheme } from "next-themes";

import CampusServicesPanel from "@/components/campus-services-panel";
import FloorSelector from "@/components/floor-selector";
import IndoorMap from "@/components/indoor-map";
import InfoCard from "@/components/info-card";
import OutdoorMap from "@/components/outdoor-map";
import SearchBar from "@/components/search-bar";
import StudentSchedulePanel from "@/components/student-schedule-panel";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  EXTERNAL_MAP_SERVICE_OPTIONS,
  OUTDOOR_MAP_STYLE_OPTIONS,
  getExternalMapServiceLabel,
  getExternalMapUrl,
  getOpenInLabel,
  type ExternalMapService,
  type OutdoorMapStyle,
} from "@/lib/campus-map-utils";
import {
  FLOORS,
  UNIVERSITY,
  getFloorLabel,
  getRoomById,
  getRoomDescription,
  getRoomDisplayName,
  getRoomTypeLabel,
  type FloorData,
  type Room,
} from "@/lib/building-data";
import { NAVIGATION_COLLECTIONS } from "@/lib/campus-data";
import { CAMPUS_SITES, getCampusSiteById, type CampusSite } from "@/lib/campus-sites";
import { estimateOutdoorWalkingTime, haversineDistance } from "@/lib/geo-utils";
import { text, type Locale } from "@/lib/i18n";
import { buildRoute, estimateWalkingTime, pixelsToMeters } from "@/lib/pathfinding";
import { APP_COPY } from "@/lib/unimap-copy";
import { cn } from "@/lib/utils";

type Panel = "navigator" | "schedule" | "places" | "services" | "details" | "settings";
type Mode = "outdoor" | "indoor" | "route";
type RouteProfile = "standard" | "accessible";
type Point = { x: number; y: number };
type StartContext = { point: Point; floor: number; label: string };
type RoutePlan = {
  destination: Room;
  profile: RouteProfile;
  startLabel: string;
  startFloor: number;
  destinationFloor: number;
  totalMeters: number;
  steps: string[];
  segments: { floor: number; path: Point[] }[];
};

const PANEL_META = [
  { id: "navigator" as const, icon: Route },
  { id: "schedule" as const, icon: CalendarClock },
  { id: "places" as const, icon: BookOpenText },
  { id: "services" as const, icon: Bell },
  { id: "details" as const, icon: PanelsTopLeft },
  { id: "settings" as const, icon: Settings2 },
];

const OUTDOOR_COPY = {
  ru: {
    universityTitle: "Жетісу университеті",
    universitySubtitle: "Навигация по корпусам и городским точкам кампуса",
    sitesTitle: "Объекты кампуса",
    sitesText:
      "Выберите корпус, библиотеку или лекционный зал. На карте одновременно видны все точки кампуса.",
    openIndoor: "Открыть этажи",
    openPhotos: "Открыть фото",
    sourceLinks: "Фотографии и галереи",
    indoorReady: "Есть внутренняя карта",
    outdoorOnly: "Пока только наружная точка",
    selected: "Выбрано на карте",
    coordinates: "Координаты",
    campusCount: "Точек кампуса",
    resizeSidebar: "Изменить ширину боковой панели",
    activeSite: "Текущая точка",
  },
  kk: {
    universityTitle: "Жетісу университеті",
    universitySubtitle: "Кампустың корпустары мен қалалық нүктелері бойынша навигация",
    sitesTitle: "Кампус нысандары",
    sitesText:
      "Корпусты, кітапхананы немесе лекциялық залды таңдаңыз. Картада кампустың барлық нүктелері бірге көрсетіледі.",
    openIndoor: "Қабаттарды ашу",
    openPhotos: "Фотоларды ашу",
    sourceLinks: "Фотолар мен галереялар",
    indoorReady: "Ішкі карта бар",
    outdoorOnly: "Әзірге тек сыртқы нүкте",
    selected: "Картада таңдалған",
    coordinates: "Координаттар",
    campusCount: "Кампус нүктелері",
    resizeSidebar: "Бүйір панель енін өзгерту",
    activeSite: "Ағымдағы нүкте",
  },
} as const;

const SETTINGS_COPY = {
  ru: {
    title: "Настройки карты",
    description: "Здесь настраиваются подложка кампус-карты, внешний сервис и live-геолокация студента.",
    mapStyleTitle: "Тип карты",
    mapStyleText: "Переключайте подложку между авто-режимом, светлой, тёмной и рельефной картой.",
    serviceTitle: "Открывать карту в сервисе",
    serviceText: "Кнопка «Открыть в...» использует выбранный внешний картографический сервис.",
    serviceHint: "Google Maps, 2GIS и Yandex Maps открываются в новой вкладке.",
    geoTitle: "Текущее местоположение",
    geoText: "Позиция обновляется через watchPosition с высокой точностью. Итоговая точность зависит от GPS, браузера и сигнала устройства.",
    geoLive: "Реалтайм включён",
    geoWaiting: "Ожидание сигнала",
    geoAccuracy: "Точность",
    geoUpdated: "Последнее обновление",
    geoUnavailable: "Нет данных",
    active: "Выбрано",
  },
  kk: {
    title: "Карта баптаулары",
    description: "Мұнда кампус картасының қабаты, сыртқы сервис және студенттің live-геолокациясы бапталады.",
    mapStyleTitle: "Карта түрі",
    mapStyleText: "Картаны авто, жарық, қараңғы және рельеф режимдері арасында ауыстырыңыз.",
    serviceTitle: "Картаны қай сервисте ашу",
    serviceText: "«Открыть в...» батырмасы таңдалған сыртқы карта сервисін қолданады.",
    serviceHint: "Google Maps, 2GIS және Yandex Maps жаңа бетте ашылады.",
    geoTitle: "Ағымдағы орналасу",
    geoText: "Позиция watchPosition арқылы жоғары дәлдікпен жаңарады. Соңғы дәлдік GPS, браузер және құрылғы сигналына тәуелді.",
    geoLive: "Реалтайм қосулы",
    geoWaiting: "Сигнал күтілуде",
    geoAccuracy: "Дәлдік",
    geoUpdated: "Соңғы жаңарту",
    geoUnavailable: "Дерек жоқ",
    active: "Таңдалды",
  },
} as const;

function getFloorById(floorId: number): FloorData {
  return FLOORS.find((floor) => floor.id === floorId) ?? FLOORS[0];
}

function getRoomCenter(room: Room): Point {
  return { x: room.x + room.width / 2, y: room.y + room.height / 2 };
}

function formatDistanceLocalized(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} м` : `${(meters / 1000).toFixed(1)} км`;
}

function formatTimeLocalized(minutes: number, locale: Locale) {
  if (minutes < 1) return locale === "ru" ? "< 1 мин" : "< 1 мин";
  if (minutes < 60) return `${Math.round(minutes)} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return locale === "ru" ? `${hours} ч ${rest} мин` : `${hours} сағ ${rest} мин`;
}

function formatGeoAccuracyLocalized(value: number | null, locale: Locale) {
  if (value === null) return locale === "ru" ? "Нет данных" : "Дерек жоқ";
  return locale === "ru" ? `≈ ${Math.round(value)} м` : `≈ ${Math.round(value)} м`;
}

function formatGeoUpdatedAt(value: number | null, locale: Locale) {
  if (value === null) return locale === "ru" ? "Нет данных" : "Дерек жоқ";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "kk-KZ", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getNearestSnapHeight(height: number, snapPoints: number[]) {
  return snapPoints.reduce((closest, point) =>
    Math.abs(point - height) < Math.abs(closest - height) ? point : closest
  );
}

function getDefaultStartContext(floorId: number, locale: Locale): StartContext {
  const floor = getFloorById(floorId);
  const entrance = floor.rooms.find((room) => room.type === "entrance") ?? floor.rooms[0];
  return { point: getRoomCenter(entrance), floor: entrance.floor, label: getRoomDisplayName(entrance, locale) };
}

function getConnectorRoom(floorId: number, profile: RouteProfile) {
  const floor = getFloorById(floorId);
  const preferred = profile === "accessible" ? "elevator" : "stairs";
  return (
    floor.rooms.find((room) => room.type === preferred) ??
    floor.rooms.find((room) => room.type === "elevator") ??
    floor.rooms.find((room) => room.type === "stairs") ??
    null
  );
}

function createRoutePlan(args: {
  start: StartContext;
  destination: Room;
  profile: RouteProfile;
  locale: Locale;
}): RoutePlan {
  const { start, destination, profile, locale } = args;
  const destinationName = getRoomDisplayName(destination, locale);

  if (start.floor === destination.floor) {
    const result = buildRoute(getFloorById(start.floor), start.point, destination);
    return {
      destination,
      profile,
      startLabel: start.label,
      startFloor: start.floor,
      destinationFloor: destination.floor,
      totalMeters: pixelsToMeters(result.distance),
      segments: [{ floor: start.floor, path: result.path }],
      steps:
        locale === "ru"
          ? [`Старт: ${start.label}.`, `Следуйте по ${getFloorLabel(start.floor, locale).toLowerCase()} к "${destinationName}".`, `Финиш: ${destination.label}.`]
          : [`Бастау: ${start.label}.`, `${getFloorLabel(start.floor, locale)} бойымен "${destinationName}" нүктесіне өтіңіз.`, `Мәре: ${destination.label}.`],
    };
  }

  const fromConnector = getConnectorRoom(start.floor, profile);
  const toConnector = getConnectorRoom(destination.floor, profile);

  if (!fromConnector || !toConnector) {
    return createRoutePlan({
      start: { ...start, floor: destination.floor },
      destination,
      profile,
      locale,
    });
  }

  const first = buildRoute(getFloorById(start.floor), start.point, fromConnector);
  const second = buildRoute(getFloorById(destination.floor), getRoomCenter(toConnector), destination);
  const connectorWay =
    profile === "accessible"
      ? locale === "ru"
        ? "на лифте"
        : "лифтпен"
      : fromConnector.type === "stairs"
      ? locale === "ru"
        ? "по лестнице"
        : "баспалдақпен"
      : locale === "ru"
      ? "на лифте"
      : "лифтпен";

  return {
    destination,
    profile,
    startLabel: start.label,
    startFloor: start.floor,
    destinationFloor: destination.floor,
    totalMeters: pixelsToMeters(first.distance + second.distance),
    segments: [
      { floor: start.floor, path: first.path },
      { floor: destination.floor, path: second.path },
    ],
    steps:
      locale === "ru"
        ? [
            `Старт: ${start.label}.`,
            `Дойдите до "${getRoomDisplayName(fromConnector, locale)}".`,
            `Поднимитесь на ${getFloorLabel(destination.floor, locale).toLowerCase()} ${connectorWay}.`,
            `Продолжайте до "${destinationName}".`,
          ]
        : [
            `Бастау: ${start.label}.`,
            `"${getRoomDisplayName(fromConnector, locale)}" нүктесіне барыңыз.`,
            `${getFloorLabel(destination.floor, locale)} ${connectorWay} көтеріліңіз.`,
            `"${destinationName}" нүктесіне дейін жалғастырыңыз.`,
          ],
  };
}

export default function UniMapApp() {
  const { resolvedTheme, setTheme } = useTheme();
  const gridRef = useRef<HTMLDivElement>(null);
  const mobileSheetContentRef = useRef<HTMLDivElement>(null);
  const mobileSheetPointerRef = useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
  } | null>(null);
  const [locale, setLocale] = useState<Locale>("ru");
  const [mode, setMode] = useState<Mode>("outdoor");
  const [panel, setPanel] = useState<Panel>("navigator");
  const [manualIndoor, setManualIndoor] = useState(false);
  const [routeProfile, setRouteProfile] = useState<RouteProfile>("standard");
  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [highlightedRoom, setHighlightedRoom] = useState<Room | null>(null);
  const [routeStart, setRouteStart] = useState<StartContext | null>(null);
  const [routeDestination, setRouteDestination] = useState<Room | null>(null);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [collectionId, setCollectionId] = useState(NAVIGATION_COLLECTIONS[0]?.id ?? "");
  const [activeOutdoorSiteId, setActiveOutdoorSiteId] = useState(CAMPUS_SITES[0]?.id ?? "");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [geoUpdatedAt, setGeoUpdatedAt] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<OutdoorMapStyle>("auto");
  const [externalMapService, setExternalMapService] = useState<ExternalMapService>("yandex");
  const [sidebarWidth, setSidebarWidth] = useState(390);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [mobileSheetHeight, setMobileSheetHeight] = useState(264);
  const [isMobileSheetDragging, setIsMobileSheetDragging] = useState(false);

  const copy = APP_COPY[locale];
  const outdoorCopy = OUTDOOR_COPY[locale];
  const settingsCopy = SETTINGS_COPY[locale];
  const panelLabels = {
    ...copy.panels,
    schedule: locale === "ru" ? "Расписание" : "Кесте",
  };
  const activeTheme = resolvedTheme === "dark" ? "dark" : "light";
  const panelLabelsWithSettings = { ...panelLabels, settings: locale === "ru" ? "Настройки" : "Баптаулар" };
  const effectiveOutdoorMapStyle = mapStyle === "auto" ? activeTheme : mapStyle;
  const isIndoor = mode !== "outdoor";
  const floorData = getFloorById(currentFloor);
  const collections = useMemo(
    () =>
      NAVIGATION_COLLECTIONS.map((item) => ({
        ...item,
        rooms: item.roomIds.map((roomId) => getRoomById(roomId)).filter((room): room is Room => Boolean(room)),
      })),
    []
  );
  const activeCollection = collections.find((item) => item.id === collectionId) ?? collections[0];
  const quickRooms = useMemo(
    () => floorData.rooms.filter((room) => ["library", "cafeteria", "service", "lab", "office"].includes(room.type)).slice(0, 5),
    [floorData]
  );
  const activeOutdoorSite = getCampusSiteById(activeOutdoorSiteId) ?? CAMPUS_SITES[0];
  const activeOutdoorMapUrl = getExternalMapUrl(activeOutdoorSite, externalMapService, locale);
  const activeExternalMapLabel = getExternalMapServiceLabel(externalMapService, locale);
  const distanceToActiveSite =
    userLat !== null && userLng !== null && activeOutdoorSite?.lat !== undefined && activeOutdoorSite?.lng !== undefined
      ? haversineDistance(userLat, userLng, activeOutdoorSite.lat, activeOutdoorSite.lng)
      : null;
  const outdoorTime = distanceToActiveSite !== null ? estimateOutdoorWalkingTime(distanceToActiveSite) : 0;
  const activeSegment = routePlan?.segments.find((segment) => segment.floor === currentFloor) ?? null;
  const indoorUserPoint = routeStart?.floor === currentFloor ? routeStart.point : null;
  const mapHighlight =
    mode === "route" && routePlan
      ? currentFloor === routePlan.destinationFloor
        ? routePlan.destination
        : getConnectorRoom(currentFloor, routePlan.profile)
      : highlightedRoom;
  const gridStyle = isDesktop ? { gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` } : undefined;
  const mobileSheetHeights = useMemo(() => {
    const baseHeight =
      viewportHeight ||
      (typeof window !== "undefined" ? window.innerHeight : 914);
    const full = Math.max(baseHeight - 18, 520);
    const peek = Math.min(clamp(baseHeight * 0.28, 240, 320), full - 140);
    const half = Math.min(
      clamp(baseHeight * 0.56, 420, 620),
      full - 64
    );

    return {
      peek,
      half: Math.max(half, peek + 96),
      full,
    };
  }, [viewportHeight]);
  const mobileSheetSnapOrder = useMemo(
    () =>
      [
        mobileSheetHeights.peek,
        mobileSheetHeights.half,
        mobileSheetHeights.full,
      ] as const,
    [mobileSheetHeights]
  );
  const mobileMapBottomOffset = isDesktop ? 16 : mobileSheetHeight + 14;

  useEffect(() => {
    const stored = window.localStorage.getItem("smart-campus-locale");
    if (stored === "ru" || stored === "kk") {
      setLocale(stored);
    }

    const storedMapStyle = window.localStorage.getItem("smart-campus-map-style");
    if (storedMapStyle === "auto" || storedMapStyle === "light" || storedMapStyle === "dark" || storedMapStyle === "relief") {
      setMapStyle(storedMapStyle);
    }

    const storedExternalMap = window.localStorage.getItem("smart-campus-external-map");
    if (storedExternalMap === "yandex" || storedExternalMap === "2gis" || storedExternalMap === "google") {
      setExternalMapService(storedExternalMap);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("smart-campus-locale", locale);
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem("smart-campus-map-style", mapStyle);
  }, [mapStyle]);

  useEffect(() => {
    window.localStorage.setItem("smart-campus-external-map", externalMapService);
  }, [externalMapService]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setSidebarWidth(390);
      setIsResizing(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop) return;

    const updateViewportHeight = () => setViewportHeight(window.innerHeight);

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);

    return () => window.removeEventListener("resize", updateViewportHeight);
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop || !viewportHeight) return;

    setMobileSheetHeight((current) => {
      const nextHeight =
        current === 0
          ? mobileSheetHeights.peek
          : clamp(current, mobileSheetHeights.peek, mobileSheetHeights.full);

      return nextHeight;
    });
  }, [isDesktop, mobileSheetHeights, viewportHeight]);

  useEffect(() => {
    if (!isResizing || !isDesktop) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      setSidebarWidth(clamp(event.clientX - rect.left, 320, 560));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDesktop, isResizing]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(copy.geoUnsupported);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        setUserLat(coords.latitude);
        setUserLng(coords.longitude);
        setUserAccuracy(Number.isFinite(coords.accuracy) ? coords.accuracy : null);
        setGeoUpdatedAt(timestamp ?? Date.now());
        setGeoError(null);
      },
      () => setGeoError(copy.geoDenied),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [copy.geoDenied, copy.geoUnsupported]);

  useEffect(() => {
    if (
      manualIndoor ||
      mode !== "outdoor" ||
      !activeOutdoorSite?.indoorAvailable ||
      distanceToActiveSite === null
    ) {
      return;
    }

    if (distanceToActiveSite <= UNIVERSITY.proximityRadius) {
      setMode("indoor");
    }
  }, [activeOutdoorSite?.indoorAvailable, distanceToActiveSite, manualIndoor, mode]);

  const focusRoom = useCallback((room: Room) => {
    setManualIndoor(true);
    setMode("indoor");
    setCurrentFloor(room.floor);
    setSelectedRoom(room);
    setHighlightedRoom(room);
    setPanel("details");
  }, []);

  const openIndoorFromSite = useCallback(
    (site: CampusSite) => {
      if (site.linkedRoomId) {
        const linkedRoom = getRoomById(site.linkedRoomId);
        if (linkedRoom) {
          focusRoom(linkedRoom);
          return;
        }
      }

      if (!site.indoorAvailable) return;

      setManualIndoor(true);
      setMode("indoor");
      setCurrentFloor(1);
      setSelectedRoom(null);
      setHighlightedRoom(null);
      setRouteStart((value) => value ?? getDefaultStartContext(1, locale));
      setPanel("navigator");
    },
    [focusRoom, locale]
  );

  const clearRoute = useCallback(() => {
    setRoutePlan(null);
    setRouteDestination(null);
    if (mode === "route") {
      setMode("indoor");
    }
  }, [mode]);

  const buildRouteTo = useCallback(
    (room: Room) => {
      const start = routeStart ?? getDefaultStartContext(currentFloor, locale);
      setRouteStart(start);
      const plan = createRoutePlan({
        start,
        destination: room,
        profile: routeProfile,
        locale,
      });
      setRouteDestination(room);
      setRoutePlan(plan);
      setMode("route");
      setManualIndoor(true);
      setCurrentFloor(plan.startFloor);
      setSelectedRoom(null);
      setHighlightedRoom(room);
      setPanel("details");
    },
    [currentFloor, locale, routeProfile, routeStart]
  );

  const nudgeMobileSheet = useCallback(
    (direction: "up" | "down") => {
      const currentHeight = getNearestSnapHeight(
        mobileSheetHeight,
        [...mobileSheetSnapOrder]
      );
      const currentIndex = mobileSheetSnapOrder.findIndex(
        (value) => value === currentHeight
      );
      const nextIndex =
        direction === "up"
          ? Math.min(currentIndex + 1, mobileSheetSnapOrder.length - 1)
          : Math.max(currentIndex - 1, 0);

      setMobileSheetHeight(mobileSheetSnapOrder[nextIndex]);
      if (direction === "up") {
        mobileSheetContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [mobileSheetHeight, mobileSheetSnapOrder]
  );

  const finishMobileSheetDrag = useCallback(() => {
    mobileSheetPointerRef.current = null;
    setIsMobileSheetDragging(false);
    setMobileSheetHeight((current) =>
      getNearestSnapHeight(current, [...mobileSheetSnapOrder])
    );
  }, [mobileSheetSnapOrder]);

  const handleMobileSheetPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isDesktop) return;

      event.preventDefault();
      mobileSheetPointerRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startHeight: mobileSheetHeight,
      };
      setIsMobileSheetDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [isDesktop, mobileSheetHeight]
  );

  const handleMobileSheetPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = mobileSheetPointerRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const delta = drag.startY - event.clientY;
      setMobileSheetHeight(
        clamp(
          drag.startHeight + delta,
          mobileSheetHeights.peek,
          mobileSheetHeights.full
        )
      );
    },
    [mobileSheetHeights]
  );

  const handleMobileSheetPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = mobileSheetPointerRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      finishMobileSheetDrag();
    },
    [finishMobileSheetDrag]
  );

  const handleMobileSheetWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (isDesktop) return;

      const content = mobileSheetContentRef.current;
      const scrollingUp = event.deltaY < 0;
      const scrollingDown = event.deltaY > 0;
      const atTop = !content || content.scrollTop <= 0;

      if (scrollingUp && mobileSheetHeight < mobileSheetHeights.full - 4) {
        event.preventDefault();
        setMobileSheetHeight((current) =>
          clamp(
            current + Math.abs(event.deltaY),
            mobileSheetHeights.peek,
            mobileSheetHeights.full
          )
        );
      }

      if (scrollingDown && atTop && mobileSheetHeight > mobileSheetHeights.peek + 4) {
        event.preventDefault();
        setMobileSheetHeight((current) =>
          clamp(
            current - Math.abs(event.deltaY),
            mobileSheetHeights.peek,
            mobileSheetHeights.full
          )
        );
      }
    },
    [isDesktop, mobileSheetHeight, mobileSheetHeights]
  );

  const renderSiteResourceLinks = (site: CampusSite) => {
    const externalMapUrl = getExternalMapUrl(site, externalMapService, locale);
    if (!externalMapUrl && !site.photoLinks?.length) return null;

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {externalMapUrl ? (
          <a
            href={externalMapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ExternalLink className="h-4 w-4" />
            {getOpenInLabel(externalMapService, locale)}
          </a>
        ) : null}
        {(site.photoLinks ?? []).map((link) => (
          <a
            key={`${site.id}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" />
            {text(link.label, locale)}
          </a>
        ))}
      </div>
    );
  };

  const renderOutdoorNavigator = () => (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">{outdoorCopy.activeSite}</p>
            <h3 className="mt-2 text-xl font-semibold">{text(activeOutdoorSite.name, locale)}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{text(activeOutdoorSite.description, locale)}</p>
          </div>
          <Badge variant="secondary">{outdoorCopy.selected}</Badge>
        </div>

        <div className="mt-4 rounded-2xl bg-muted/70 p-4">
          <p className="text-sm font-medium">{text(activeOutdoorSite.address, locale)}</p>
          {distanceToActiveSite !== null ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {formatDistanceLocalized(distanceToActiveSite)} · {formatTimeLocalized(outdoorTime, locale)}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {activeOutdoorSite.indoorAvailable ? (
            <button
              type="button"
              onClick={() => openIndoorFromSite(activeOutdoorSite)}
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {outdoorCopy.openIndoor}
            </button>
          ) : (
            <Badge variant="outline" className="rounded-2xl px-4 py-3 text-sm font-medium">
              {outdoorCopy.outdoorOnly}
            </Badge>
          )}
        </div>

        {renderSiteResourceLinks(activeOutdoorSite)}
      </section>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">{outdoorCopy.sitesTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{outdoorCopy.sitesText}</p>
        <div className="mt-4 grid gap-2">
          {CAMPUS_SITES.map((site) => (
            <button
              key={site.id}
              type="button"
              onClick={() => {
                setActiveOutdoorSiteId(site.id);
                setPanel("navigator");
              }}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition-colors",
                site.id === activeOutdoorSiteId
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{text(site.name, locale)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{text(site.address, locale)}</p>
                </div>
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const renderDetailsPanel = () => {
    if (!isIndoor) {
      return (
        <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{text(activeOutdoorSite.name, locale)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text(activeOutdoorSite.address, locale)}</p>
            </div>
            <Badge variant={activeOutdoorSite.indoorAvailable ? "secondary" : "outline"}>
              {activeOutdoorSite.indoorAvailable ? outdoorCopy.indoorReady : outdoorCopy.outdoorOnly}
            </Badge>
          </div>

          <p className="mt-4 text-sm text-foreground/85">{text(activeOutdoorSite.description, locale)}</p>

          {activeOutdoorSite.lat !== undefined && activeOutdoorSite.lng !== undefined ? (
            <div className="mt-4 rounded-2xl bg-muted/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{outdoorCopy.coordinates}</p>
              <p className="mt-2 text-sm font-medium">
                {activeOutdoorSite.lat.toFixed(6)}, {activeOutdoorSite.lng.toFixed(6)}
              </p>
            </div>
          ) : null}

          {activeOutdoorSite.indoorAvailable ? (
            <button
              type="button"
              onClick={() => openIndoorFromSite(activeOutdoorSite)}
              className="mt-4 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {outdoorCopy.openIndoor}
            </button>
          ) : null}

          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{outdoorCopy.sourceLinks}</p>
            {renderSiteResourceLinks(activeOutdoorSite)}
          </div>
        </section>
      );
    }

    if (routePlan) {
      return (
        <InfoCard
          mode="route"
          locale={locale}
          destinationName={getRoomDisplayName(routePlan.destination, locale)}
          destinationCode={routePlan.destination.label}
          distance={formatDistanceLocalized(routePlan.totalMeters)}
          time={formatTimeLocalized(estimateWalkingTime(routePlan.totalMeters), locale)}
          profileLabel={routePlan.profile === "accessible" ? copy.routeAccessible : copy.routeStandard}
          floorHint={getFloorLabel(routePlan.destinationFloor, locale)}
          steps={routePlan.steps}
          onClose={clearRoute}
        />
      );
    }

    if (selectedRoom) {
      return (
        <InfoCard
          mode="room"
          locale={locale}
          roomName={getRoomDisplayName(selectedRoom, locale)}
          roomCode={selectedRoom.label}
          roomType={getRoomTypeLabel(selectedRoom.type, locale)}
          floorLabel={getFloorLabel(selectedRoom.floor, locale)}
          description={getRoomDescription(selectedRoom, locale)}
          accessible={selectedRoom.accessible}
          onSetStart={() => {
            setRouteStart({
              point: getRoomCenter(selectedRoom),
              floor: selectedRoom.floor,
              label: getRoomDisplayName(selectedRoom, locale),
            });
            setPanel("navigator");
          }}
          onSetDestination={() => {
            setRouteDestination(selectedRoom);
            setPanel("navigator");
          }}
          onClose={() => setSelectedRoom(null)}
        />
      );
    }

    return (
      <section className="rounded-[28px] border border-dashed border-border bg-card p-6 text-center shadow-sm">
        <Sparkles className="mx-auto h-10 w-10 text-primary" />
        <h3 className="mt-4 text-base font-semibold">{copy.emptyDetailsTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{copy.emptyDetailsText}</p>
      </section>
    );
  };

  const renderSettingsPanel = () => (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">{settingsCopy.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{settingsCopy.description}</p>
      </section>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Map className="mt-0.5 h-5 w-5 text-primary" />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold">{settingsCopy.mapStyleTitle}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{settingsCopy.mapStyleText}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {OUTDOOR_MAP_STYLE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMapStyle(option.id)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition-colors",
                mapStyle === option.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{text(option.label, locale)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{text(option.description, locale)}</p>
                </div>
                {mapStyle === option.id ? <Badge variant="secondary">{settingsCopy.active}</Badge> : null}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ExternalLink className="mt-0.5 h-5 w-5 text-primary" />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold">{settingsCopy.serviceTitle}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{settingsCopy.serviceText}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {EXTERNAL_MAP_SERVICE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setExternalMapService(option.id)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition-colors",
                externalMapService === option.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{text(option.label, locale)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{text(option.description, locale)}</p>
                </div>
                {externalMapService === option.id ? <Badge variant="secondary">{settingsCopy.active}</Badge> : null}
              </div>
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">{settingsCopy.serviceHint}</p>
      </section>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <LocateFixed className="mt-0.5 h-5 w-5 text-primary" />
            <div className="min-w-0">
              <h4 className="text-sm font-semibold">{settingsCopy.geoTitle}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{settingsCopy.geoText}</p>
            </div>
          </div>
          <Badge variant={userLat !== null && userLng !== null ? "secondary" : "outline"}>
            {userLat !== null && userLng !== null ? settingsCopy.geoLive : settingsCopy.geoWaiting}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{settingsCopy.geoAccuracy}</p>
            <p className="mt-2 text-sm font-medium">{formatGeoAccuracyLocalized(userAccuracy, locale)}</p>
          </div>
          <div className="rounded-2xl bg-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{settingsCopy.geoUpdated}</p>
            <p className="mt-2 text-sm font-medium">{formatGeoUpdatedAt(geoUpdatedAt, locale)}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{settingsCopy.serviceTitle}</p>
          <p className="mt-2 text-sm font-medium">{activeExternalMapLabel}</p>
        </div>

        {geoError ? <p className="mt-4 text-sm font-medium text-destructive">{geoError}</p> : null}
      </section>
    </div>
  );

  const renderPanel = () => {
    if (panel === "navigator") {
      if (!isIndoor) return renderOutdoorNavigator();

      return (
        <div className="space-y-4">
          <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">{copy.quickRoutes}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{copy.quickRoutesText}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{copy.accessible}</p>
                <p className="text-xs text-muted-foreground">{copy.accessibleHint}</p>
                <Switch
                  checked={routeProfile === "accessible"}
                  onCheckedChange={(checked) => setRouteProfile(checked ? "accessible" : "standard")}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {quickRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => buildRouteTo(room)}
                  className="rounded-2xl border border-border px-4 py-3 text-left transition-colors hover:bg-muted"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{room.label}</p>
                  <p className="mt-1 text-sm font-semibold">{getRoomDisplayName(room, locale)}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold">{copy.routeBuilder}</h3>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-muted/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.start}</p>
                <p className="mt-2 text-sm font-medium">{routeStart?.label ?? copy.chooseStart}</p>
              </div>
              <div className="rounded-2xl bg-muted/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.destination}</p>
                <p className="mt-2 text-sm font-medium">
                  {routeDestination ? getRoomDisplayName(routeDestination, locale) : copy.chooseDestination}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRouteStart(getDefaultStartContext(currentFloor, locale))}
                className="rounded-2xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                {copy.myPoint}
              </button>
              <button
                type="button"
                onClick={() => routeDestination && buildRouteTo(routeDestination)}
                className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                disabled={!routeDestination}
              >
                {copy.buildRoute}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearRoute();
                  setSelectedRoom(null);
                }}
                className="rounded-2xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                {copy.clear}
              </button>
            </div>
          </section>
        </div>
      );
    }

    if (panel === "places") {
      return (
        <div className="space-y-4">
          <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold">{copy.collectionsTitle}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{copy.collectionsText}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {collections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCollectionId(item.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    item.id === activeCollection?.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background hover:bg-muted"
                  )}
                >
                  {text(item.label, locale)}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
            <h4 className="text-sm font-semibold">{text(activeCollection.label, locale)}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{text(activeCollection.description, locale)}</p>
            <div className="mt-4 grid gap-2">
              {activeCollection.rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => focusRoom(room)}
                  className="rounded-2xl border border-border px-4 py-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{getRoomDisplayName(room, locale)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {getFloorLabel(room.floor, locale)} · {getRoomTypeLabel(room.type, locale)}
                      </p>
                    </div>
                    <Badge variant="outline">{room.label}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      );
    }

    if (panel === "schedule") {
      return <StudentSchedulePanel locale={locale} />;
    }

    if (panel === "services") {
      return (
        <div className="space-y-4">
          <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold">{copy.servicesTitle}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{copy.servicesText}</p>
          </section>
          <CampusServicesPanel
            locale={locale}
            onOpenRouteToRoom={(roomId) => {
              const room = getRoomById(roomId);
              if (room) buildRouteTo(room);
            }}
            campusSites={CAMPUS_SITES}
            activeOutdoorSiteId={activeOutdoorSiteId}
            userLat={userLat}
            userLng={userLng}
            onSelectOutdoorSite={setActiveOutdoorSiteId}
          />
        </div>
      );
    }

    if (panel === "settings") {
      return renderSettingsPanel();
    }

    return renderDetailsPanel();
  };

  const renderSidebarContent = () => (
    <>
      <div className="rounded-[28px] border border-border bg-card p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-primary">
          {outdoorCopy.universityTitle}
        </p>
        <h1 className="mt-3 text-xl font-semibold">
          {text(UNIVERSITY.name, locale)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {outdoorCopy.universitySubtitle}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {text(UNIVERSITY.address, locale)}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {copy.language}
            </p>
            <div className="flex rounded-2xl border border-border bg-background p-1">
              {(["ru", "kk"] as Locale[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocale(value)}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    locale === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Globe2 className="mr-2 inline h-4 w-4" />
                  {value === "ru" ? copy.localeRu : copy.localeKk}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {copy.theme}
            </p>
            <button
              type="button"
              onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              {activeTheme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <SunMedium className="h-4 w-4" />
              )}
              <span>{activeTheme === "dark" ? copy.dark : copy.light}</span>
            </button>
          </div>
        </div>
      </div>

      <SearchBar locale={locale} onSelect={focusRoom} />

      <div className="grid grid-cols-2 gap-2">
        {PANEL_META.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanel(id)}
            className={cn(
              "rounded-2xl px-4 py-2.5 text-left text-sm font-medium transition-colors",
              panel === id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card hover:bg-muted"
            )}
          >
            <Icon className="mr-2 inline h-4 w-4" />
            {panelLabelsWithSettings[id]}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1",
          isDesktop
            ? "pb-6"
            : "pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
        )}
      >
        {renderPanel()}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        ref={gridRef}
        className={cn(
          "relative min-h-screen",
          isDesktop &&
            "grid lg:h-[100dvh] lg:grid-cols-[390px_minmax(0,1fr)] lg:overflow-hidden"
        )}
        style={gridStyle}
      >
        <main
          className={cn(
            isDesktop
              ? "p-4 lg:order-2 lg:min-h-0 lg:p-6"
              : "fixed inset-0 z-0 p-0"
          )}
        >
          <div
            className={cn(
              "relative h-full overflow-hidden bg-card",
              isDesktop
                ? "min-h-[560px] rounded-[34px] border border-border shadow-2xl"
                : "min-h-[100svh] rounded-none"
            )}
          >
            {isIndoor ? (
              <IndoorMap
                locale={locale}
                floor={floorData}
                selectedRoom={selectedRoom}
                highlightedRoom={mapHighlight}
                route={activeSegment?.path ?? null}
                userPosition={indoorUserPoint}
                onRoomClick={focusRoom}
                onMapClick={() => {
                  if (mode !== "route") setSelectedRoom(null);
                }}
              />
            ) : (
              <OutdoorMap
                locale={locale}
                mapStyle={effectiveOutdoorMapStyle}
                sites={CAMPUS_SITES}
                selectedSiteId={activeOutdoorSiteId}
                userLat={userLat}
                userLng={userLng}
                userAccuracy={userAccuracy}
                externalMapService={externalMapService}
                onSiteSelect={setActiveOutdoorSiteId}
              />
            )}

            <div className="pointer-events-none absolute inset-x-4 top-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
              <div className="pointer-events-auto max-w-[min(100%,560px)] rounded-[24px] bg-background/92 px-4 py-3 shadow-lg backdrop-blur">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isIndoor) {
                        setMode("outdoor");
                        setManualIndoor(false);
                        clearRoute();
                      }
                    }}
                    className={cn(
                      "rounded-xl p-2 transition-colors hover:bg-muted",
                      !isIndoor && "opacity-50"
                    )}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{isIndoor ? copy.mapTitle : copy.campusMap}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {isIndoor ? text(UNIVERSITY.name, locale) : text(activeOutdoorSite.name, locale)}
                    </p>
                    {!isIndoor ? (
                      <p className="truncate text-xs text-muted-foreground/80">
                        {text(activeOutdoorSite.address, locale)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="pointer-events-auto flex flex-wrap items-center gap-3 xl:justify-end">
                {isIndoor ? (
                  <FloorSelector locale={locale} currentFloor={currentFloor} onChange={setCurrentFloor} />
                ) : (
                  <Badge variant="secondary">
                    {outdoorCopy.campusCount}: {CAMPUS_SITES.filter((site) => site.lat !== undefined && site.lng !== undefined).length}
                  </Badge>
                )}

                {isIndoor ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("outdoor");
                      setManualIndoor(false);
                      clearRoute();
                    }}
                    className="rounded-2xl border border-border bg-background/92 px-4 py-3 text-sm font-medium shadow-lg backdrop-blur transition-colors hover:bg-muted"
                  >
                    {copy.returnToCampus}
                  </button>
                ) : activeOutdoorMapUrl ? (
                  <a
                    href={activeOutdoorMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background/92 px-4 py-3 text-sm font-medium shadow-lg backdrop-blur transition-colors hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {getOpenInLabel(externalMapService, locale)}
                  </a>
                ) : null}

                {!isIndoor && activeOutdoorSite.photoLinks?.[0] ? (
                  <a
                    href={activeOutdoorSite.photoLinks[0].url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background/92 px-4 py-3 text-sm font-medium shadow-lg backdrop-blur transition-colors hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {outdoorCopy.openPhotos}
                  </a>
                ) : null}

                {!isIndoor && activeOutdoorSite.indoorAvailable ? (
                  <button
                    type="button"
                    onClick={() => openIndoorFromSite(activeOutdoorSite)}
                    className="rounded-2xl border border-border bg-background/92 px-4 py-3 text-sm font-medium shadow-lg backdrop-blur transition-colors hover:bg-muted"
                  >
                    {outdoorCopy.openIndoor}
                  </button>
                ) : null}
              </div>
            </div>

            <div
              className="pointer-events-none absolute inset-x-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between"
              style={{ bottom: mobileMapBottomOffset }}
            >
              <div className="pointer-events-auto rounded-[24px] bg-background/90 px-4 py-3 shadow-lg backdrop-blur">
                {isIndoor ? (
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[hsl(var(--map-route))]" />
                      {copy.userLegend}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[hsl(var(--map-highlight))]" />
                      {copy.destinationLegend}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-8 rounded-full bg-[hsl(var(--map-route))]" />
                      {copy.lineLegend}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[hsl(var(--map-route))]" />
                      {copy.userLegend}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-primary" />
                      {outdoorCopy.activeSite}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-muted-foreground" />
                      {outdoorCopy.sitesTitle}
                    </span>
                  </div>
                )}
              </div>

              {isIndoor && routePlan ? (
                <div className="pointer-events-auto rounded-[24px] bg-background/90 px-4 py-3 shadow-lg backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.routeOnMap}</p>
                  <p className="mt-1 text-sm font-semibold">{getRoomDisplayName(routePlan.destination, locale)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDistanceLocalized(routePlan.totalMeters)} ·{" "}
                    {formatTimeLocalized(estimateWalkingTime(routePlan.totalMeters), locale)}
                  </p>
                </div>
              ) : !isIndoor ? (
                <div className="pointer-events-auto rounded-[24px] bg-background/90 px-4 py-3 shadow-lg backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{outdoorCopy.coordinates}</p>
                  <p className="mt-1 text-sm font-semibold">{text(activeOutdoorSite.name, locale)}</p>
                  {activeOutdoorSite.lat !== undefined && activeOutdoorSite.lng !== undefined ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeOutdoorSite.lat.toFixed(6)}, {activeOutdoorSite.lng.toFixed(6)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {geoError ? (
              <div
                className="absolute right-4 rounded-full bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground shadow-lg"
                style={{ bottom: mobileMapBottomOffset }}
              >
                {geoError}
              </div>
            ) : null}
          </div>
        </main>

        <aside
          className={cn(
            isDesktop
              ? "relative z-10 lg:order-1 border-r border-border bg-background/95 backdrop-blur group/sidebar"
              : "fixed inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-[32px] border border-border bg-background/95 shadow-[0_-20px_50px_rgba(15,23,42,0.22)] backdrop-blur supports-[backdrop-filter]:bg-background/88"
          )}
          style={!isDesktop ? { height: mobileSheetHeight } : undefined}
        >
          {isDesktop ? (
            <>
              <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto px-4 py-4 pr-2 xl:px-5 xl:py-5">
                {renderSidebarContent()}
              </div>

              <div
                role="separator"
                aria-orientation="vertical"
                aria-label={outdoorCopy.resizeSidebar}
                className="absolute inset-y-0 -right-3 z-20 hidden w-6 cursor-col-resize items-center justify-center lg:flex"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setIsResizing(true);
                }}
                onDoubleClick={() => setSidebarWidth(390)}
              >
                <div
                  className={cn(
                    "flex h-16 w-4 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow transition-all opacity-0 group-hover/sidebar:opacity-100 hover:opacity-100",
                    isResizing && "opacity-100"
                  )}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="border-b border-border/80 px-4 pb-3 pt-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => nudgeMobileSheet("down")}
                    disabled={mobileSheetHeight <= mobileSheetHeights.peek + 6}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  <div
                    className={cn(
                      "rounded-full border border-border bg-card px-5 py-3 shadow-sm touch-none transition-colors",
                      isMobileSheetDragging && "bg-muted"
                    )}
                    onPointerDown={handleMobileSheetPointerDown}
                    onPointerMove={handleMobileSheetPointerMove}
                    onPointerUp={handleMobileSheetPointerUp}
                    onPointerCancel={handleMobileSheetPointerUp}
                  >
                    <div className="h-1.5 w-14 rounded-full bg-muted-foreground/40" />
                  </div>

                  <button
                    type="button"
                    onClick={() => nudgeMobileSheet("up")}
                    disabled={mobileSheetHeight >= mobileSheetHeights.full - 6}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">
                      {panelLabelsWithSettings[panel]}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {locale === "ru"
                        ? "Панель кампуса"
                        : "Кампус панелі"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {locale === "ru"
                        ? "Тяните вверх или вниз, чтобы открыть карту и контент в нужной пропорции."
                        : "Карта мен контенттің арақатынасын өзгерту үшін панельді жоғары не төмен тартыңыз."}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {Math.round((mobileSheetHeight / mobileSheetHeights.full) * 100)}%
                  </Badge>
                </div>
              </div>

              <div
                ref={mobileSheetContentRef}
                onWheel={handleMobileSheetWheel}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3"
              >
                <div className="flex min-h-full flex-col gap-3">
                  {renderSidebarContent()}
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
