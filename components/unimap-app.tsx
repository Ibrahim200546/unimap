"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpenText,
  Globe2,
  LocateFixed,
  Moon,
  PanelsTopLeft,
  Route,
  Sparkles,
  SunMedium,
  Waypoints,
} from "lucide-react";
import { useTheme } from "next-themes";

import CampusServicesPanel from "@/components/campus-services-panel";
import FloorSelector from "@/components/floor-selector";
import IndoorMap from "@/components/indoor-map";
import InfoCard from "@/components/info-card";
import OutdoorMap from "@/components/outdoor-map";
import SearchBar from "@/components/search-bar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { estimateOutdoorWalkingTime, haversineDistance } from "@/lib/geo-utils";
import { text, type Locale } from "@/lib/i18n";
import { buildRoute, estimateWalkingTime, pixelsToMeters } from "@/lib/pathfinding";
import { APP_COPY } from "@/lib/unimap-copy";
import { cn } from "@/lib/utils";

type Panel = "navigator" | "places" | "services" | "details";
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
  { id: "places" as const, icon: BookOpenText },
  { id: "services" as const, icon: Bell },
  { id: "details" as const, icon: PanelsTopLeft },
];

function getFloorById(floorId: number): FloorData {
  return FLOORS.find((floor) => floor.id === floorId) ?? FLOORS[0];
}

function getRoomCenter(room: Room): Point {
  return { x: room.x + room.width / 2, y: room.y + room.height / 2 };
}

function formatDistanceLocalized(meters: number, locale: Locale) {
  const unit = locale === "ru" ? ["м", "км"] : ["м", "км"];
  return meters < 1000 ? `${Math.round(meters)} ${unit[0]}` : `${(meters / 1000).toFixed(1)} ${unit[1]}`;
}

function formatTimeLocalized(minutes: number, locale: Locale) {
  if (minutes < 1) return locale === "ru" ? "< 1 мин" : "< 1 мин";
  if (minutes < 60) return `${Math.round(minutes)} ${locale === "ru" ? "мин" : "мин"}`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return locale === "ru" ? `${hours} ч ${rest} мин` : `${hours} сағ ${rest} мин`;
}

function getDefaultStartContext(floorId: number, locale: Locale): StartContext {
  const floor = getFloorById(floorId);
  const entrance = floor.rooms.find((room) => room.type === "entrance") ?? floor.rooms[0];
  return { point: getRoomCenter(entrance), floor: entrance.floor, label: getRoomDisplayName(entrance, locale) };
}

function getConnectorRoom(floorId: number, profile: RouteProfile) {
  const floor = getFloorById(floorId);
  const preferred = profile === "accessible" ? "elevator" : "stairs";
  return floor.rooms.find((room) => room.type === preferred) ?? floor.rooms.find((room) => room.type === "elevator") ?? floor.rooms.find((room) => room.type === "stairs") ?? null;
}

function createRoutePlan(args: { start: StartContext; destination: Room; profile: RouteProfile; locale: Locale }): RoutePlan {
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
          : [`Бастау: ${start.label}.`, `${getFloorLabel(start.floor, locale)} бойымен "${destinationName}" нүктесіне өтіңіз.`, `Мәресі: ${destination.label}.`],
    };
  }
  const fromConnector = getConnectorRoom(start.floor, profile);
  const toConnector = getConnectorRoom(destination.floor, profile);
  if (!fromConnector || !toConnector) return createRoutePlan({ start: { ...start, floor: destination.floor }, destination, profile, locale });
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
        ? [`Старт: ${start.label}.`, `Дойдите до "${getRoomDisplayName(fromConnector, locale)}".`, `Поднимитесь на ${getFloorLabel(destination.floor, locale).toLowerCase()} ${connectorWay}.`, `Продолжайте до "${destinationName}".`]
        : [`Бастау: ${start.label}.`, `"${getRoomDisplayName(fromConnector, locale)}" нүктесіне барыңыз.`, `${getFloorLabel(destination.floor, locale)} ${connectorWay} көтеріліңіз.`, `"${destinationName}" нүктесіне дейін жалғастырыңыз.`],
  };
}

export default function UniMapApp() {
  const { resolvedTheme, setTheme } = useTheme();
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
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const copy = APP_COPY[locale];
  const activeTheme = resolvedTheme === "dark" ? "dark" : "light";
  const isIndoor = mode !== "outdoor";
  const floorData = getFloorById(currentFloor);
  const collections = useMemo(() => NAVIGATION_COLLECTIONS.map((item) => ({ ...item, rooms: item.roomIds.map((roomId) => getRoomById(roomId)).filter((room): room is Room => Boolean(room)) })), []);
  const activeCollection = collections.find((item) => item.id === collectionId) ?? collections[0];
  const quickRooms = useMemo(() => floorData.rooms.filter((room) => ["library", "cafeteria", "service", "lab", "office"].includes(room.type)).slice(0, 5), [floorData]);
  const distanceToUni = userLat !== null && userLng !== null ? haversineDistance(userLat, userLng, UNIVERSITY.lat, UNIVERSITY.lng) : null;
  const outdoorTime = distanceToUni !== null ? estimateOutdoorWalkingTime(distanceToUni) : 0;
  const activeSegment = routePlan?.segments.find((segment) => segment.floor === currentFloor) ?? null;
  const indoorUserPoint = routeStart?.floor === currentFloor ? routeStart.point : null;
  const mapHighlight = mode === "route" && routePlan ? currentFloor === routePlan.destinationFloor ? routePlan.destination : getConnectorRoom(currentFloor, routePlan.profile) : highlightedRoom;

  useEffect(() => {
    const stored = window.localStorage.getItem("smart-campus-locale");
    if (stored === "ru" || stored === "kk") setLocale(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("smart-campus-locale", locale);
  }, [locale]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(copy.geoUnsupported);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserLat(coords.latitude);
        setUserLng(coords.longitude);
        setGeoError(null);
      },
      () => setGeoError(copy.geoDenied),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [copy.geoDenied, copy.geoUnsupported]);

  useEffect(() => {
    if (manualIndoor || distanceToUni === null) return;
    if (distanceToUni <= UNIVERSITY.proximityRadius) setMode((value) => (value === "outdoor" ? "indoor" : value));
  }, [distanceToUni, manualIndoor]);

  const focusRoom = useCallback((room: Room) => {
    setManualIndoor(true);
    setMode("indoor");
    setCurrentFloor(room.floor);
    setSelectedRoom(room);
    setHighlightedRoom(room);
    setPanel("details");
  }, []);

  const clearRoute = useCallback(() => {
    setRoutePlan(null);
    setRouteDestination(null);
    if (mode === "route") setMode("indoor");
  }, [mode]);

  const buildRouteTo = useCallback((room: Room) => {
    const start = routeStart ?? getDefaultStartContext(currentFloor, locale);
    setRouteStart(start);
    const plan = createRoutePlan({ start, destination: room, profile: routeProfile, locale });
    setRouteDestination(room);
    setRoutePlan(plan);
    setMode("route");
    setManualIndoor(true);
    setCurrentFloor(plan.startFloor);
    setSelectedRoom(null);
    setHighlightedRoom(room);
    setPanel("details");
  }, [currentFloor, locale, routeProfile, routeStart]);

  const renderPanel = () => {
    if (panel === "navigator") {
      if (!isIndoor) return <InfoCard mode="outdoor" locale={locale} universityName={text(UNIVERSITY.name, locale)} distance={distanceToUni !== null ? formatDistanceLocalized(distanceToUni, locale) : "—"} time={distanceToUni !== null ? formatTimeLocalized(outdoorTime, locale) : "—"} onNavigate={() => { setManualIndoor(true); setMode("indoor"); setRouteStart((value) => value ?? getDefaultStartContext(1, locale)); }} />;
      return (
        <div className="space-y-4">
          <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-base font-semibold">{copy.quickRoutes}</h3><p className="mt-1 text-sm text-muted-foreground">{copy.quickRoutesText}</p></div><div className="text-right"><p className="text-sm font-medium">{copy.accessible}</p><p className="text-xs text-muted-foreground">{copy.accessibleHint}</p><Switch checked={routeProfile === "accessible"} onCheckedChange={(checked) => setRouteProfile(checked ? "accessible" : "standard")} /></div></div>
            <div className="mt-4 grid gap-2">{quickRooms.map((room) => <button key={room.id} type="button" onClick={() => buildRouteTo(room)} className="rounded-2xl border border-border px-4 py-3 text-left transition-colors hover:bg-muted"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{room.label}</p><p className="mt-1 text-sm font-semibold">{getRoomDisplayName(room, locale)}</p></button>)}</div>
          </section>
          <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold">{copy.routeBuilder}</h3>
            <div className="mt-4 grid gap-3"><div className="rounded-2xl bg-muted/70 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.start}</p><p className="mt-2 text-sm font-medium">{routeStart?.label ?? copy.chooseStart}</p></div><div className="rounded-2xl bg-muted/70 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.destination}</p><p className="mt-2 text-sm font-medium">{routeDestination ? getRoomDisplayName(routeDestination, locale) : copy.chooseDestination}</p></div></div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setRouteStart(getDefaultStartContext(currentFloor, locale))} className="rounded-2xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted">{copy.myPoint}</button>
              <button type="button" onClick={() => routeDestination && buildRouteTo(routeDestination)} className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50" disabled={!routeDestination}>{copy.buildRoute}</button>
              <button type="button" onClick={() => { clearRoute(); setSelectedRoom(null); }} className="rounded-2xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted">{copy.clear}</button>
            </div>
          </section>
        </div>
      );
    }
    if (panel === "places") return <div className="space-y-4"><section className="rounded-[28px] border border-border bg-card p-5 shadow-sm"><h3 className="text-base font-semibold">{copy.collectionsTitle}</h3><p className="mt-1 text-sm text-muted-foreground">{copy.collectionsText}</p><div className="mt-4 flex flex-wrap gap-2">{collections.map((item) => <button key={item.id} type="button" onClick={() => setCollectionId(item.id)} className={cn("rounded-full px-4 py-2 text-sm font-medium transition-colors", item.id === activeCollection?.id ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-muted")}>{text(item.label, locale)}</button>)}</div></section><section className="rounded-[28px] border border-border bg-card p-5 shadow-sm"><h4 className="text-sm font-semibold">{text(activeCollection.label, locale)}</h4><p className="mt-1 text-sm text-muted-foreground">{text(activeCollection.description, locale)}</p><div className="mt-4 grid gap-2">{activeCollection.rooms.map((room) => <button key={room.id} type="button" onClick={() => focusRoom(room)} className="rounded-2xl border border-border px-4 py-3 text-left transition-colors hover:bg-muted"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{getRoomDisplayName(room, locale)}</p><p className="mt-1 text-xs text-muted-foreground">{getFloorLabel(room.floor, locale)} · {getRoomTypeLabel(room.type, locale)}</p></div><Badge variant="outline">{room.label}</Badge></div></button>)}</div></section></div>;
    if (panel === "services") return <div className="space-y-4"><section className="rounded-[28px] border border-border bg-card p-5 shadow-sm"><h3 className="text-base font-semibold">{copy.servicesTitle}</h3><p className="mt-1 text-sm text-muted-foreground">{copy.servicesText}</p></section><CampusServicesPanel locale={locale} onOpenRouteToRoom={(roomId) => { const room = getRoomById(roomId); if (room) buildRouteTo(room); }} /></div>;
    if (routePlan) return <InfoCard mode="route" locale={locale} destinationName={getRoomDisplayName(routePlan.destination, locale)} destinationCode={routePlan.destination.label} distance={formatDistanceLocalized(routePlan.totalMeters, locale)} time={formatTimeLocalized(estimateWalkingTime(routePlan.totalMeters), locale)} profileLabel={routePlan.profile === "accessible" ? copy.routeAccessible : copy.routeStandard} floorHint={getFloorLabel(routePlan.destinationFloor, locale)} steps={routePlan.steps} onClose={clearRoute} />;
    if (selectedRoom) return <InfoCard mode="room" locale={locale} roomName={getRoomDisplayName(selectedRoom, locale)} roomCode={selectedRoom.label} roomType={getRoomTypeLabel(selectedRoom.type, locale)} floorLabel={getFloorLabel(selectedRoom.floor, locale)} description={getRoomDescription(selectedRoom, locale)} accessible={selectedRoom.accessible} onSetStart={() => { setRouteStart({ point: getRoomCenter(selectedRoom), floor: selectedRoom.floor, label: getRoomDisplayName(selectedRoom, locale) }); setPanel("navigator"); }} onSetDestination={() => { setRouteDestination(selectedRoom); setPanel("navigator"); }} onClose={() => setSelectedRoom(null)} />;
    return <section className="rounded-[28px] border border-dashed border-border bg-card p-6 text-center shadow-sm"><Sparkles className="mx-auto h-10 w-10 text-primary" /><h3 className="mt-4 text-base font-semibold">{copy.emptyDetailsTitle}</h3><p className="mt-2 text-sm text-muted-foreground">{copy.emptyDetailsText}</p></section>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-background/95 px-4 py-4 backdrop-blur lg:border-b-0 lg:border-r lg:px-5 lg:py-5">
          <div className="flex h-full flex-col gap-4">
            <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-primary">{copy.eyebrow}</p>
              <h1 className="mt-3 text-2xl font-semibold">{copy.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.language}</p><div className="flex rounded-2xl border border-border bg-background p-1">{(["ru", "kk"] as Locale[]).map((value) => <button key={value} type="button" onClick={() => setLocale(value)} className={cn("flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors", locale === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Globe2 className="mr-2 inline h-4 w-4" />{value === "ru" ? copy.localeRu : copy.localeKk}</button>)}</div></div>
                <div><p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.theme}</p><button type="button" onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")} className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted">{activeTheme === "dark" ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}<span>{activeTheme === "dark" ? copy.dark : copy.light}</span></button></div>
              </div>
            </div>
            <SearchBar locale={locale} onSelect={focusRoom} />
            <div className="grid grid-cols-2 gap-2">{PANEL_META.map(({ id, icon: Icon }) => <button key={id} type="button" onClick={() => setPanel(id)} className={cn("rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors", panel === id ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted")}><Icon className="mr-2 inline h-4 w-4" />{copy.panels[id]}</button>)}</div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">{renderPanel()}</div>
          </div>
        </aside>
        <main className="p-4 lg:p-6">
          <div className="relative h-full min-h-[560px] overflow-hidden rounded-[34px] border border-border bg-card shadow-2xl">
            {isIndoor ? <IndoorMap locale={locale} floor={floorData} selectedRoom={selectedRoom} highlightedRoom={mapHighlight} route={activeSegment?.path ?? null} userPosition={indoorUserPoint} onRoomClick={focusRoom} onMapClick={() => mode !== "route" && setSelectedRoom(null)} /> : <OutdoorMap userLat={userLat} userLng={userLng} uniLat={UNIVERSITY.lat} uniLng={UNIVERSITY.lng} uniName={text(UNIVERSITY.name, locale)} theme={activeTheme} />}
            <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="pointer-events-auto flex items-center gap-3 rounded-[24px] bg-background/90 px-4 py-3 shadow-lg backdrop-blur"><button type="button" onClick={() => { if (isIndoor) { setMode("outdoor"); setManualIndoor(false); clearRoute(); } }} className={cn("rounded-xl p-2 transition-colors hover:bg-muted", !isIndoor && "opacity-50")}><ArrowLeft className="h-4 w-4" /></button><div><p className="text-sm font-semibold">{isIndoor ? copy.mapTitle : copy.campusMap}</p><p className="text-xs text-muted-foreground">{text(UNIVERSITY.name, locale)}</p></div></div>
              <div className="pointer-events-auto flex items-center gap-3">{isIndoor ? <FloorSelector locale={locale} currentFloor={currentFloor} onChange={setCurrentFloor} /> : <Badge variant="secondary">{copy.modes.outdoor}</Badge>}<button type="button" onClick={() => { setManualIndoor(true); setMode(isIndoor ? "outdoor" : "indoor"); setRouteStart((value) => value ?? getDefaultStartContext(1, locale)); }} className="rounded-2xl border border-border bg-background/90 px-4 py-3 text-sm font-medium shadow-lg backdrop-blur">{isIndoor ? copy.returnToCampus : copy.openIndoor}</button></div>
            </div>
            <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="pointer-events-auto rounded-[24px] bg-background/90 px-4 py-3 shadow-lg backdrop-blur"><div className="flex flex-wrap items-center gap-4 text-sm"><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[hsl(var(--map-route))]" />{copy.userLegend}</span><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[hsl(var(--map-highlight))]" />{copy.destinationLegend}</span><span className="inline-flex items-center gap-2"><span className="h-1.5 w-8 rounded-full bg-[hsl(var(--map-route))]" />{copy.lineLegend}</span></div></div>
              {routePlan ? <div className="pointer-events-auto rounded-[24px] bg-background/90 px-4 py-3 shadow-lg backdrop-blur"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.routeOnMap}</p><p className="mt-1 text-sm font-semibold">{getRoomDisplayName(routePlan.destination, locale)}</p><p className="mt-1 text-sm text-muted-foreground">{formatDistanceLocalized(routePlan.totalMeters, locale)} · {formatTimeLocalized(estimateWalkingTime(routePlan.totalMeters), locale)}</p></div> : null}
            </div>
            {geoError ? <div className="absolute bottom-4 right-4 rounded-full bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground shadow-lg">{geoError}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
