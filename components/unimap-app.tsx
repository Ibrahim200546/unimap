"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Accessibility,
  ArrowLeft,
  Bell,
  Building2,
  LocateFixed,
  MapPin,
  Route,
  Sparkles,
} from "lucide-react";

import {
  FLOORS,
  UNIVERSITY,
  getRoomById,
  getRoomDisplayName,
  getRoomTypeLabel,
  type FloorData,
  type Room,
} from "@/lib/building-data";
import { NAVIGATION_COLLECTIONS } from "@/lib/campus-data";
import {
  buildRoute,
  estimateWalkingTime,
  pixelsToMeters,
} from "@/lib/pathfinding";
import {
  estimateOutdoorWalkingTime,
  formatDistance,
  formatTime,
  haversineDistance,
} from "@/lib/geo-utils";

import IndoorMap from "@/components/indoor-map";
import OutdoorMap from "@/components/outdoor-map";
import SearchBar from "@/components/search-bar";
import FloorSelector from "@/components/floor-selector";
import InfoCard from "@/components/info-card";
import CampusServicesPanel from "@/components/campus-services-panel";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type AppMode = "outdoor" | "indoor" | "route";
type AppSection = "navigation" | "services";
type RouteProfile = "standard" | "accessible";

interface Point {
  x: number;
  y: number;
}

interface RouteSegment {
  floor: number;
  path: Point[];
  distance: number;
  fromLabel: string;
  toLabel: string;
}

interface RouteStartContext {
  point: Point;
  floor: number;
  label: string;
}

interface RoutePlan {
  destination: Room;
  startLabel: string;
  profile: RouteProfile;
  segments: RouteSegment[];
  totalMeters: number;
  startFloor: number;
  destinationFloor: number;
  steps: string[];
}

function getFloorById(floorId: number): FloorData {
  return FLOORS.find((floor) => floor.id === floorId) ?? FLOORS[0];
}

function getRoomCenter(room: Room): Point {
  return {
    x: room.x + room.width / 2,
    y: room.y + room.height / 2,
  };
}

function getDefaultStartContext(floorId = 1): RouteStartContext {
  const floor = getFloorById(floorId);
  const entrance =
    floor.rooms.find((room) => room.type === "entrance") ?? floor.rooms[0];

  return {
    point: getRoomCenter(entrance),
    floor: entrance.floor,
    label: getRoomDisplayName(entrance),
  };
}

function getConnectorRoom(
  floorId: number,
  profile: RouteProfile
): Room | null {
  const floor = getFloorById(floorId);
  const preferredType = profile === "accessible" ? "elevator" : "stairs";

  return (
    floor.rooms.find((room) => room.type === preferredType) ??
    floor.rooms.find((room) => room.type === "elevator") ??
    floor.rooms.find((room) => room.type === "stairs") ??
    null
  );
}

function createRoutePlan({
  start,
  destination,
  profile,
}: {
  start: RouteStartContext;
  destination: Room;
  profile: RouteProfile;
}): RoutePlan {
  if (start.floor === destination.floor) {
    const sameFloor = getFloorById(start.floor);
    const result = buildRoute(sameFloor, start.point, destination);
    const totalMeters = pixelsToMeters(result.distance);

    return {
      destination,
      startLabel: start.label,
      profile,
      segments: [
        {
          floor: start.floor,
          path: result.path,
          distance: result.distance,
          fromLabel: start.label,
          toLabel: getRoomDisplayName(destination),
        },
      ],
      totalMeters,
      startFloor: start.floor,
      destinationFloor: destination.floor,
      steps: [
        `Стартуйте от точки "${start.label}".`,
        `Двигайтесь по ${start.floor}-му этажу к "${getRoomDisplayName(
          destination
        )}".`,
        `Финиш: ${destination.label}.`,
      ],
    };
  }

  const startConnector = getConnectorRoom(start.floor, profile);
  const destinationConnector = getConnectorRoom(destination.floor, profile);

  if (!startConnector || !destinationConnector) {
    return createRoutePlan({
      start: { ...start, floor: destination.floor },
      destination,
      profile,
    });
  }

  const startFloor = getFloorById(start.floor);
  const destinationFloor = getFloorById(destination.floor);
  const firstSegment = buildRoute(startFloor, start.point, startConnector);
  const secondSegment = buildRoute(
    destinationFloor,
    getRoomCenter(destinationConnector),
    destination
  );
  const totalMeters = pixelsToMeters(
    firstSegment.distance + secondSegment.distance
  );
  const connectorPhrase =
    profile === "accessible"
      ? "лифтом"
      : startConnector.type === "stairs"
      ? "лестницей"
      : "лифтом";

  return {
    destination,
    startLabel: start.label,
    profile,
    segments: [
      {
        floor: start.floor,
        path: firstSegment.path,
        distance: firstSegment.distance,
        fromLabel: start.label,
        toLabel: getRoomDisplayName(startConnector),
      },
      {
        floor: destination.floor,
        path: secondSegment.path,
        distance: secondSegment.distance,
        fromLabel: getRoomDisplayName(destinationConnector),
        toLabel: getRoomDisplayName(destination),
      },
    ],
    totalMeters,
    startFloor: start.floor,
    destinationFloor: destination.floor,
    steps: [
      `Стартуйте от точки "${start.label}".`,
      `Дойдите до "${getRoomDisplayName(startConnector)}" на ${
        start.floor
      }-м этаже.`,
      `Поднимитесь на ${destination.floor}-й этаж ${connectorPhrase}.`,
      `Продолжайте до "${getRoomDisplayName(destination)}".`,
    ],
  };
}

export default function UniMapApp() {
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [mode, setMode] = useState<AppMode>("outdoor");
  const [activeSection, setActiveSection] =
    useState<AppSection>("navigation");
  const [manualIndoor, setManualIndoor] = useState(false);
  const [routeProfile, setRouteProfile] =
    useState<RouteProfile>("standard");

  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [highlightedRoom, setHighlightedRoom] = useState<Room | null>(null);
  const [userMapPosition, setUserMapPosition] = useState<Point | null>(null);
  const [routeStart, setRouteStart] = useState<Point | null>(null);
  const [routeStartFloor, setRouteStartFloor] = useState<number | null>(null);
  const [routeStartLabel, setRouteStartLabel] = useState("Главный вход");
  const [routeDestination, setRouteDestination] = useState<Room | null>(null);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);

  const distanceToUni =
    userLat !== null && userLng !== null
      ? haversineDistance(userLat, userLng, UNIVERSITY.lat, UNIVERSITY.lng)
      : null;

  const isIndoor = mode === "indoor" || mode === "route";
  const floorData = getFloorById(currentFloor);

  const navigationCollections = NAVIGATION_COLLECTIONS.map((collection) => ({
    ...collection,
    rooms: collection.roomIds
      .map((roomId) => getRoomById(roomId))
      .filter((room): room is Room => Boolean(room)),
  }));

  const nearbyRooms = floorData.rooms.filter((room) =>
    ["library", "cafeteria", "service", "lab", "office", "restroom"].includes(
      room.type
    )
  );

  const activeRouteSegment =
    routePlan?.segments.find((segment) => segment.floor === currentFloor) ??
    null;
  const routeTimeMinutes = routePlan
    ? estimateWalkingTime(routePlan.totalMeters)
    : 0;

  const clearRoute = useCallback(() => {
    setRoutePlan(null);
    setRouteDestination(null);
    setHighlightedRoom(null);
    if (mode === "route") {
      setMode("indoor");
    }
  }, [mode]);

  const applyStartContext = useCallback((context: RouteStartContext) => {
    setRouteStart(context.point);
    setRouteStartFloor(context.floor);
    setRouteStartLabel(context.label);
    setUserMapPosition(context.point);
  }, []);

  const buildAndActivateRoute = useCallback(
    (destination: Room, startContext: RouteStartContext) => {
      const plan = createRoutePlan({
        start: startContext,
        destination,
        profile: routeProfile,
      });

      setRouteDestination(destination);
      setRoutePlan(plan);
      setMode("route");
      setManualIndoor(true);
      setActiveSection("navigation");
      setCurrentFloor(plan.startFloor);
      setSelectedRoom(null);
      setHighlightedRoom(destination);
    },
    [routeProfile]
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Браузер не поддерживает геолокацию.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLat(position.coords.latitude);
        setUserLng(position.coords.longitude);
        setGeoError(null);
      },
      () => {
        setGeoError("Не удалось получить текущую геопозицию.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (manualIndoor) return;

    if (distanceToUni !== null && distanceToUni <= UNIVERSITY.proximityRadius) {
      if (mode === "outdoor") {
        setMode("indoor");
      }
      return;
    }

    if (mode === "indoor" || mode === "route") {
      setMode("outdoor");
      clearRoute();
    }
  }, [clearRoute, distanceToUni, manualIndoor, mode]);

  useEffect(() => {
    if (mode !== "route" || !routePlan) return;

    if (currentFloor === routePlan.destinationFloor) {
      setHighlightedRoom(routePlan.destination);
      return;
    }

    const connector = getConnectorRoom(currentFloor, routePlan.profile);
    setHighlightedRoom(connector);
  }, [currentFloor, mode, routePlan]);

  const handleRoomClick = useCallback(
    (room: Room) => {
      if (mode === "route") return;

      setSelectedRoom(room);
      setHighlightedRoom(room);

      if (routeStart && !routePlan) {
        setRouteDestination(room);
      }
    },
    [mode, routePlan, routeStart]
  );

  const handleMapClick = useCallback(() => {
    if (mode !== "route") {
      setSelectedRoom(null);
    }
  }, [mode]);

  const focusRoom = useCallback(
    (room: Room) => {
      setActiveSection("navigation");
      setCurrentFloor(room.floor);
      setHighlightedRoom(room);
      setSelectedRoom(room);
      setRoutePlan(null);
      setRouteDestination(null);
      setManualIndoor(true);

      if (mode === "outdoor" || mode === "route") {
        setMode("indoor");
      }
    },
    [mode]
  );

  const handleSearch = useCallback(
    (room: Room) => {
      focusRoom(room);
    },
    [focusRoom]
  );

  const handleSetMyLocation = useCallback(() => {
    const startContext = getDefaultStartContext(currentFloor);
    applyStartContext(startContext);
  }, [applyStartContext, currentFloor]);

  const handleSetRoomAsStart = useCallback(() => {
    if (!selectedRoom) return;

    applyStartContext({
      point: getRoomCenter(selectedRoom),
      floor: selectedRoom.floor,
      label: getRoomDisplayName(selectedRoom),
    });
    setSelectedRoom(null);
  }, [applyStartContext, selectedRoom]);

  const handleSetRoomAsDestination = useCallback(() => {
    if (!selectedRoom) return;

    setRoutePlan(null);
    setRouteDestination(selectedRoom);
    setSelectedRoom(null);
  }, [selectedRoom]);

  const handleBuildRoute = useCallback(() => {
    if (!routeStart || !routeDestination || routeStartFloor === null) return;

    buildAndActivateRoute(routeDestination, {
      point: routeStart,
      floor: routeStartFloor,
      label: routeStartLabel,
    });
  }, [
    buildAndActivateRoute,
    routeDestination,
    routeStart,
    routeStartFloor,
    routeStartLabel,
  ]);

  const handleQuickRoute = useCallback(
    (roomId: string) => {
      const room = getRoomById(roomId);
      if (!room) return;

      const startContext =
        routeStart && routeStartFloor !== null
          ? {
              point: routeStart,
              floor: routeStartFloor,
              label: routeStartLabel,
            }
          : getDefaultStartContext(isIndoor ? currentFloor : 1);

      applyStartContext(startContext);
      buildAndActivateRoute(room, startContext);
    },
    [
      applyStartContext,
      buildAndActivateRoute,
      currentFloor,
      isIndoor,
      routeStart,
      routeStartFloor,
      routeStartLabel,
    ]
  );

  const handleEnterIndoor = useCallback(() => {
    setManualIndoor(true);
    setMode("indoor");
    setCurrentFloor(1);
    if (!routeStart || routeStartFloor === null) {
      applyStartContext(getDefaultStartContext(1));
    }
  }, [applyStartContext, routeStart, routeStartFloor]);

  const handleBackToOutdoor = useCallback(() => {
    setManualIndoor(false);
    setActiveSection("navigation");
    setMode("outdoor");
    setSelectedRoom(null);
    clearRoute();
  }, [clearRoute]);

  const activeMapHighlight =
    mode === "route" && routePlan
      ? currentFloor === routePlan.destinationFloor
        ? routePlan.destination
        : getConnectorRoom(currentFloor, routePlan.profile)
      : highlightedRoom;

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-background">
      <div className="absolute inset-0">
        {isIndoor ? (
          <IndoorMap
            floor={floorData}
            selectedRoom={selectedRoom}
            highlightedRoom={activeMapHighlight}
            route={mode === "route" ? activeRouteSegment?.path ?? null : null}
            userPosition={userMapPosition}
            onRoomClick={handleRoomClick}
            onMapClick={handleMapClick}
          />
        ) : (
          <OutdoorMap
            userLat={userLat}
            userLng={userLng}
            uniLat={UNIVERSITY.lat}
            uniLng={UNIVERSITY.lng}
            uniName={UNIVERSITY.name}
          />
        )}
      </div>

      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-colors",
          activeSection === "services" && "bg-background/45"
        )}
      />

      <div className="absolute top-0 left-0 right-0 z-10 p-4 pb-0">
        <div className="flex items-center gap-3 mb-3">
          {isIndoor && (
            <button
              onClick={handleBackToOutdoor}
              className="flex items-center justify-center w-11 h-11 bg-card rounded-xl shadow-lg border border-border text-foreground hover:bg-muted transition-colors shrink-0"
              aria-label="Назад к карте кампуса"
              type="button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <SearchBar onSelect={handleSearch} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-card rounded-xl shadow-lg border border-border px-3 py-2">
            {isIndoor ? (
              <Building2 className="w-4 h-4 text-primary" />
            ) : (
              <MapPin className="w-4 h-4 text-primary" />
            )}
            <span className="text-xs font-medium text-foreground">
              {mode === "outdoor"
                ? "Кампус"
                : mode === "route"
                ? "Маршрут"
                : "Корпус"}
            </span>
          </div>

          {isIndoor && (
            <FloorSelector
              currentFloor={currentFloor}
              onChange={setCurrentFloor}
            />
          )}

          {mode === "route" && routePlan ? (
            <Badge variant="secondary">
              {routePlan.profile === "accessible"
                ? "Без лестниц"
                : "Стандартный маршрут"}
            </Badge>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-card/95 p-1 shadow-lg border border-border">
          <button
            onClick={() => setActiveSection("navigation")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              activeSection === "navigation"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            type="button"
          >
            <Route className="h-4 w-4" />
            Навигация
          </button>
          <button
            onClick={() => setActiveSection("services")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              activeSection === "services"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            type="button"
          >
            <Bell className="h-4 w-4" />
            Сервисы кампуса
          </button>
        </div>

        {geoError && mode === "outdoor" && (
          <div className="mt-2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-lg">
            <p className="text-xs text-muted-foreground">{geoError}</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pt-0">
        {activeSection === "services" ? (
          <CampusServicesPanel onOpenRouteToRoom={handleQuickRoute} />
        ) : (
          <>
            <div className="mb-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      Быстрые сценарии навигации
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Выберите популярную точку кампуса или включите безбарьерный
                    маршрут для маломобильных пользователей.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">
                      Без лестниц
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Лифт и широкие проходы
                    </p>
                  </div>
                  <Switch
                    checked={routeProfile === "accessible"}
                    onCheckedChange={(checked) =>
                      setRouteProfile(checked ? "accessible" : "standard")
                    }
                    aria-label="Включить безбарьерный маршрут"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {nearbyRooms.slice(0, 5).map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleQuickRoute(room.id)}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-left hover:bg-muted transition-colors min-w-[9rem]"
                    type="button"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {room.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {getRoomDisplayName(room)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur space-y-3">
              {navigationCollections.map((collection) => (
                <div key={collection.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {collection.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {collection.description}
                      </p>
                    </div>
                    <Badge variant="outline">{collection.rooms.length}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {collection.rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => handleQuickRoute(room.id)}
                        className="rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        type="button"
                      >
                        {getRoomDisplayName(room)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {isIndoor && mode !== "route" && (
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={handleSetMyLocation}
                  className="flex items-center gap-2 px-4 py-3 bg-card rounded-xl shadow-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  type="button"
                >
                  <LocateFixed className="w-4 h-4 text-primary" />
                  Моя точка
                </button>
                <button
                  onClick={handleBuildRoute}
                  disabled={!routeStart || !routeDestination}
                  className="flex items-center gap-2 px-4 py-3 bg-primary rounded-xl shadow-lg text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  type="button"
                >
                  <Route className="w-4 h-4" />
                  Построить маршрут
                </button>
              </div>
            )}

            {isIndoor && mode !== "route" && (routeStart || routeDestination) && (
              <div className="mb-3 bg-card rounded-xl shadow-lg border border-border px-4 py-3 flex items-center gap-3">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                    <span className="text-xs text-foreground truncate">
                      {routeStart ? routeStartLabel : "Задайте старт"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
                    <span className="text-xs text-foreground truncate">
                      {routeDestination
                        ? getRoomDisplayName(routeDestination)
                        : "Выберите точку назначения"}
                    </span>
                  </div>
                </div>
                {(routeStart || routeDestination) && (
                  <button
                    onClick={clearRoute}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    type="button"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            )}

            {mode === "route" && routePlan && (
              <InfoCard
                mode="route"
                destinationName={getRoomDisplayName(routePlan.destination)}
                destinationCode={routePlan.destination.label}
                distance={formatDistance(routePlan.totalMeters)}
                time={formatTime(routeTimeMinutes)}
                profileLabel={
                  routePlan.profile === "accessible"
                    ? "Безбарьерный профиль"
                    : "Стандартный профиль"
                }
                floorHint={
                  routePlan.startFloor === routePlan.destinationFloor
                    ? `${routePlan.startFloor} этаж`
                    : `Этаж ${currentFloor}: ${
                        currentFloor === routePlan.destinationFloor
                          ? "финальный участок"
                          : "переход к коннектору"
                      }`
                }
                steps={routePlan.steps}
                onClose={clearRoute}
              />
            )}

            {selectedRoom && mode !== "route" && isIndoor && (
              <InfoCard
                mode="room"
                roomName={getRoomDisplayName(selectedRoom)}
                roomCode={selectedRoom.label}
                roomType={getRoomTypeLabel(selectedRoom.type)}
                floor={selectedRoom.floor}
                description={selectedRoom.description}
                accessible={selectedRoom.accessible}
                onSetStart={handleSetRoomAsStart}
                onSetDestination={handleSetRoomAsDestination}
                onClose={() => setSelectedRoom(null)}
              />
            )}

            {mode === "outdoor" && (
              <InfoCard
                mode="outdoor"
                universityName={UNIVERSITY.name}
                distance={
                  distanceToUni !== null
                    ? formatDistance(distanceToUni)
                    : "Определяем..."
                }
                time={
                  distanceToUni !== null
                    ? formatTime(estimateOutdoorWalkingTime(distanceToUni))
                    : "..."
                }
                onNavigate={handleEnterIndoor}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
