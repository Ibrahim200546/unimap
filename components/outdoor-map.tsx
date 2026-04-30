"use client";

import { useEffect, useRef, useState } from "react";

import {
  getExternalMapUrl,
  getOpenInLabel,
  type ExternalMapService,
  type GlobalMapProvider,
  type ResolvedOutdoorMapStyle,
} from "@/lib/campus-map-utils";
import type { CampusSite } from "@/lib/campus-sites";
import type { CampusTransitMapOverlay } from "@/lib/campus-transit";
import type { Locale } from "@/lib/i18n";
import { text } from "@/lib/i18n";

interface OutdoorMapProps {
  locale: Locale;
  mapStyle: ResolvedOutdoorMapStyle;
  sites: CampusSite[];
  selectedSiteId: string;
  userLat: number | null;
  userLng: number | null;
  userAccuracy: number | null;
  externalMapService: ExternalMapService;
  globalMapProvider: GlobalMapProvider;
  transitOverlay: CampusTransitMapOverlay | null;
  onSiteSelect: (siteId: string) => void;
}

export default function OutdoorMap({
  locale,
  mapStyle,
  sites,
  selectedSiteId,
  userLat,
  userLng,
  userAccuracy,
  externalMapService,
  globalMapProvider,
  transitOverlay,
  onSiteSelect,
}: OutdoorMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const transitLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const siteLayerRef = useRef<any>(null);
  const siteMarkersRef = useRef<Map<string, any>>(new Map());
  const routeCacheRef = useRef<Map<string, [number, number][]>>(new Map());
  const lastTransitViewportKeyRef = useRef<string | null>(null);
  const [mapReadyKey, setMapReadyKey] = useState(0);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function init() {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      const defaultSite = sites.find((site) => site.lat && site.lng) ?? sites[0];
      const center = defaultSite?.lat && defaultSite?.lng ? [defaultSite.lat, defaultSite.lng] : [45.008698, 78.349901];
      const crs =
        globalMapProvider === "yandex"
          ? leaflet.CRS.EPSG3395
          : leaflet.CRS.EPSG3857;

      const map = leaflet.map(containerRef.current, {
        center,
        zoom: 14,
        crs,
        zoomControl: true,
        attributionControl: true,
      });

      const tileConfig = getTileLayerConfig(mapStyle, globalMapProvider);
      tileLayerRef.current = leaflet
        .tileLayer(tileConfig.url, {
          attribution: tileConfig.attribution,
          maxZoom: tileConfig.maxZoom,
          subdomains: tileConfig.subdomains,
        })
        .addTo(map);
      mapRef.current = map;
      setMapReadyKey((value) => value + 1);
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tileLayerRef.current = null;
      siteLayerRef.current = null;
      siteMarkersRef.current = new Map();
      userMarkerRef.current = null;
      userAccuracyRef.current = null;
      routeLineRef.current = null;
      transitLayerRef.current = null;
      lastTransitViewportKeyRef.current = null;
    };
  }, [globalMapProvider, sites]);

  useEffect(() => {
    async function updateTileTheme() {
      if (!mapRef.current) return;
      const leaflet = await import("leaflet");

      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }

      const tileConfig = getTileLayerConfig(mapStyle, globalMapProvider);
      tileLayerRef.current = leaflet
        .tileLayer(tileConfig.url, {
          attribution: tileConfig.attribution,
          maxZoom: tileConfig.maxZoom,
          subdomains: tileConfig.subdomains,
        })
        .addTo(mapRef.current);
    }

    updateTileTheme();
  }, [globalMapProvider, mapReadyKey, mapStyle]);

  useEffect(() => {
    async function updateSiteMarkers() {
      if (!mapRef.current) return;
      const leaflet = await import("leaflet");
      const map = mapRef.current;

      if (siteLayerRef.current) {
        map.removeLayer(siteLayerRef.current);
      }

      const layer = leaflet.layerGroup().addTo(map);
      const markers = new Map<string, any>();
      const points: [number, number][] = [];

      for (const site of sites) {
        if (site.lat === undefined || site.lng === undefined) continue;

        points.push([site.lat, site.lng]);

        const marker = leaflet
          .marker([site.lat, site.lng], {
            icon: getSiteIcon(leaflet, site.kind, site.id === selectedSiteId),
          })
          .addTo(layer)
          .bindPopup(buildPopup(site, locale, externalMapService))
          .on("click", () => onSiteSelect(site.id));

        markers.set(site.id, marker);
      }

      siteLayerRef.current = layer;
      siteMarkersRef.current = markers;

      if (points.length > 0 && userLat === null && userLng === null) {
        const bounds = leaflet.latLngBounds(points);
        map.fitBounds(bounds, { padding: [72, 72] });
      }
    }

    updateSiteMarkers();
  }, [externalMapService, globalMapProvider, locale, mapReadyKey, onSiteSelect, selectedSiteId, sites, userLat, userLng]);

  useEffect(() => {
    async function syncSelectedSite() {
      if (!mapRef.current) return;
      const marker = siteMarkersRef.current.get(selectedSiteId);
      if (!marker) return;

      marker.openPopup();
      mapRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.35 });
    }

    syncSelectedSite();
  }, [globalMapProvider, mapReadyKey, selectedSiteId]);

  useEffect(() => {
    let cancelled = false;

    async function updateUserMarker() {
      if (!mapRef.current) return;
      const leaflet = await import("leaflet");
      const map = mapRef.current;
      const targetSite = sites.find((site) => site.id === selectedSiteId && site.lat !== undefined && site.lng !== undefined);

      if (userLat === null || userLng === null) {
        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current);
          userMarkerRef.current = null;
        }
        if (userAccuracyRef.current) {
          map.removeLayer(userAccuracyRef.current);
          userAccuracyRef.current = null;
        }
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
        return;
      }

      const userIcon = leaflet.divIcon({
        className: "user-marker",
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: hsl(160 60% 42%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.22);
          "></div>
          <div style="
            position: absolute;
            inset: -8px;
            background: hsla(160, 60%, 42%, 0.15);
            border-radius: 50%;
            z-index: -1;
          "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLat, userLng]);
      } else {
        userMarkerRef.current = leaflet.marker([userLat, userLng], { icon: userIcon }).addTo(map);
      }

      if (userAccuracy && Number.isFinite(userAccuracy)) {
        if (userAccuracyRef.current) {
          userAccuracyRef.current.setLatLng([userLat, userLng]);
          userAccuracyRef.current.setRadius(userAccuracy);
        } else {
          userAccuracyRef.current = leaflet
            .circle([userLat, userLng], {
              radius: userAccuracy,
              color: "hsl(210 70% 45%)",
              weight: 1.5,
              opacity: 0.35,
              fillColor: "hsl(210 70% 45%)",
              fillOpacity: 0.1,
            })
            .addTo(map);
        }
      } else if (userAccuracyRef.current) {
        map.removeLayer(userAccuracyRef.current);
        userAccuracyRef.current = null;
      }

      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }

      if (transitOverlay) {
        return;
      }

      const points: [number, number][] = sites
        .filter((site): site is CampusSite & { lat: number; lng: number } => site.lat !== undefined && site.lng !== undefined)
        .map((site) => [site.lat, site.lng]);

      points.push([userLat, userLng]);

      if (targetSite) {
        const routePoints = await getRoadRoute({
          userLat,
          userLng,
          targetLat: targetSite.lat!,
          targetLng: targetSite.lng!,
          cache: routeCacheRef.current,
          cacheKey: `${selectedSiteId}:${userLat.toFixed(5)}:${userLng.toFixed(5)}`,
        });

        if (!cancelled) {
          routeLineRef.current = leaflet
            .polyline(routePoints, {
              color: "hsl(210 70% 45%)",
              weight: 4,
              opacity: 0.82,
              dashArray: "10 8",
            })
            .addTo(map);

          points.push(...routePoints);
        }
      }

      if (points.length > 1) {
        const bounds = leaflet.latLngBounds(points);
        map.fitBounds(bounds, { padding: [72, 72] });
      }
    }

    updateUserMarker();
    return () => {
      cancelled = true;
    };
  }, [globalMapProvider, mapReadyKey, selectedSiteId, sites, transitOverlay, userAccuracy, userLat, userLng]);

  useEffect(() => {
    let cancelled = false;

    async function updateTransitOverlay() {
      if (!mapRef.current) return;
      const leaflet = await import("leaflet");
      const map = mapRef.current;

      if (transitLayerRef.current) {
        map.removeLayer(transitLayerRef.current);
        transitLayerRef.current = null;
      }

      if (!transitOverlay) {
        lastTransitViewportKeyRef.current = null;
        return;
      }

      const layer = leaflet.layerGroup().addTo(map);
      const option = transitOverlay.option;
      const transitViewportKey = [
        transitOverlay.target.siteId,
        option.id,
        option.firstRouteId,
        option.departureStopId,
        option.arrivalStopId,
      ].join(":");
      const segment =
        option.routeSegment.length > 1
          ? option.routeSegment.map((point) => [point.lat, point.lng] as [number, number])
          : ([
              [option.departureStopLat, option.departureStopLng],
              [option.arrivalStopLat, option.arrivalStopLng],
            ] satisfies [number, number][]);

      leaflet
        .polyline(segment, {
          color: "#d94c1a",
          weight: 5,
          opacity: 0.94,
          lineJoin: "round",
        })
        .addTo(layer);

      leaflet
        .circleMarker([option.departureStopLat, option.departureStopLng], {
          radius: 7,
          color: "#2563eb",
          weight: 3,
          fillColor: "#ffffff",
          fillOpacity: 1,
        })
        .addTo(layer)
        .bindTooltip(locale === "ru" ? "Посадка" : locale === "kk" ? "Отыру" : "Boarding", {
          direction: "top",
          offset: [0, -8],
        });

      leaflet
        .circleMarker([option.arrivalStopLat, option.arrivalStopLng], {
          radius: 7,
          color: "#0f766e",
          weight: 3,
          fillColor: "#ffffff",
          fillOpacity: 1,
        })
        .addTo(layer)
        .bindTooltip(locale === "ru" ? "Выход" : locale === "kk" ? "Түсу" : "Exit", {
          direction: "top",
          offset: [0, -8],
        });

      const overlayPoints: [number, number][] = [...segment];

      option.liveBuses.forEach((bus) => {
        overlayPoints.push([bus.lat, bus.lng]);

        leaflet
          .marker([bus.lat, bus.lng], {
            icon: leaflet.divIcon({
              className: "campus-transit-bus-marker",
              html: `
                <div style="
                  width: 18px;
                  height: 18px;
                  border-radius: 9999px;
                  background: ${bus.offline ? "#64748b" : "#f59e0b"};
                  border: 3px solid #ffffff;
                  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.24);
                "></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            }),
          })
          .addTo(layer)
          .bindPopup(`
            <div style="font-family:Inter,system-ui,sans-serif;min-width:160px;">
              <div style="font-size:13px;font-weight:700;">${escapeHtml(locale === "en" ? "Route" : "Маршрут")}: ${escapeHtml(option.firstRouteNumber)}</div>
              <div style="margin-top:4px;font-size:12px;color:#334155;">
                ${escapeHtml(locale === "en" ? "Bus" : "Автобус")}: ${escapeHtml(bus.label)}
              </div>
              <div style="margin-top:4px;font-size:12px;color:#64748b;">
                ${bus.offline ? (locale === "en" ? "Offline" : "Оффлайн") : locale === "ru" ? "На линии" : locale === "kk" ? "Желіде" : "Online"}
              </div>
              <div style="margin-top:4px;font-size:12px;color:#334155;">
                ${locale === "ru" ? "Скорость" : locale === "kk" ? "Жылдамдық" : "Speed"}: ${Math.round(bus.speed)} ${locale === "en" ? "km/h" : "км/ч"}
              </div>
            </div>
          `);
      });

      transitLayerRef.current = layer;

      if (userLat !== null && userLng !== null) {
        overlayPoints.push([userLat, userLng]);
      }

      overlayPoints.push([transitOverlay.target.lat, transitOverlay.target.lng]);

      if (
        !cancelled &&
        overlayPoints.length > 1 &&
        lastTransitViewportKeyRef.current !== transitViewportKey
      ) {
        const bounds = leaflet.latLngBounds(overlayPoints);
        map.fitBounds(bounds, { padding: [72, 72], maxZoom: 16 });
        lastTransitViewportKeyRef.current = transitViewportKey;
      }
    }

    updateTransitOverlay();

    return () => {
      cancelled = true;
    };
  }, [globalMapProvider, locale, mapReadyKey, transitOverlay, userLat, userLng]);

  return (
    <div
      ref={containerRef}
      className={[
        "h-full w-full rounded-[28px]",
        mapStyle === "dark" && globalMapProvider !== "osm"
          ? "leaflet-filtered-dark-map"
          : "",
      ].join(" ")}
      role="application"
      aria-label="Outdoor map with university campus locations"
    />
  );
}

function buildPopup(site: CampusSite, locale: Locale, externalMapService: ExternalMapService) {
  const externalMapUrl = getExternalMapUrl(site, externalMapService, locale);
  const links = (site.photoLinks ?? [])
    .map(
      (link) =>
        `<a href="${link.url}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;justify-content:center;padding:8px 10px;border-radius:12px;background:hsl(var(--muted));color:hsl(var(--foreground));text-decoration:none;font-size:12px;font-weight:600;">${escapeHtml(
          text(link.label, locale)
        )}</a>`
    )
    .join("");
  const openInLink = externalMapUrl
    ? `<a href="${externalMapUrl}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;justify-content:center;padding:8px 10px;border-radius:12px;background:hsl(var(--foreground));color:hsl(var(--background));text-decoration:none;font-size:12px;font-weight:600;">${escapeHtml(
        getOpenInLabel(externalMapService, locale)
      )}</a>`
    : "";

  return `
    <div style="width:260px;padding:4px 2px;font-family:Inter,system-ui,sans-serif;">
      <div style="font-size:14px;font-weight:700;color:hsl(var(--foreground));">${escapeHtml(text(site.name, locale))}</div>
      <div style="margin-top:6px;font-size:12px;line-height:1.45;color:hsl(var(--muted-foreground));">${escapeHtml(text(site.address, locale))}</div>
      <div style="margin-top:8px;font-size:12px;line-height:1.5;color:hsl(var(--foreground));">${escapeHtml(text(site.description, locale))}</div>
      ${links || openInLink ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">${openInLink}${links}</div>` : ""}
    </div>`;
}

function getSiteIcon(leaflet: any, kind: CampusSite["kind"], selected: boolean) {
  const color = getSiteColor(kind);
  const size = selected ? 42 : 34;
  const inner = selected ? 18 : 14;

  return leaflet.divIcon({
    className: "campus-site-marker",
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        background:${color};
        border-radius:50%;
        border:3px solid white;
        box-shadow:${selected ? "0 10px 28px rgba(15,23,42,0.28)" : "0 8px 18px rgba(15,23,42,0.18)"};
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <div style="
          width:${inner}px;
          height:${inner}px;
          border-radius:50%;
          background:white;
        "></div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function getSiteColor(kind: CampusSite["kind"]) {
  if (kind === "main") return "hsl(210 70% 45%)";
  if (kind === "library") return "hsl(160 60% 42%)";
  if (kind === "lecture") return "hsl(24 92% 50%)";
  return "hsl(220 16% 42%)";
}

function getTileLayerConfig(
  mapStyle: ResolvedOutdoorMapStyle,
  globalMapProvider: GlobalMapProvider
) {
  const openStreetMapAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  if (globalMapProvider === "google") {
    return {
      url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      attribution: "&copy; Google Maps",
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    };
  }

  if (globalMapProvider === "2gis") {
    return {
      url: "https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}",
      attribution: "&copy; 2GIS",
      maxZoom: 18,
      subdomains: ["0", "1", "2", "3"],
    };
  }

  if (globalMapProvider === "yandex") {
    return {
      url: "https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU",
      attribution: "&copy; Yandex Maps",
      maxZoom: 19,
      subdomains: "abc",
    };
  }

  if (mapStyle === "dark") {
    return {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: `${openStreetMapAttribution}, &copy; <a href="https://carto.com/attributions">CARTO</a>`,
      maxZoom: 19,
      subdomains: ["a", "b", "c", "d"],
    };
  }

  if (mapStyle === "relief") {
    return {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: `${openStreetMapAttribution}, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>`,
      maxZoom: 17,
      subdomains: ["a", "b", "c"],
    };
  }

  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: openStreetMapAttribution,
    maxZoom: 19,
    subdomains: "abc",
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function getRoadRoute({
  userLat,
  userLng,
  targetLat,
  targetLng,
  cache,
  cacheKey,
}: {
  userLat: number;
  userLng: number;
  targetLat: number;
  targetLng: number;
  cache: Map<string, [number, number][]>;
  cacheKey: string;
}) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${targetLng},${targetLat}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    const coordinates = data?.routes?.[0]?.geometry?.coordinates;

    if (Array.isArray(coordinates) && coordinates.length > 1) {
      const route = coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
      cache.set(cacheKey, route);
      return route;
    }
  } catch {
    // Fall back to a straight segment if the routing service is unavailable.
  }

  const fallback: [number, number][] = [
    [userLat, userLng],
    [targetLat, targetLng],
  ];
  cache.set(cacheKey, fallback);
  return fallback;
}
