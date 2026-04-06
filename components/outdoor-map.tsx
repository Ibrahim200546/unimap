"use client";

import { useEffect, useRef } from "react";

import type { CampusSite } from "@/lib/campus-sites";
import type { Locale } from "@/lib/i18n";
import { text } from "@/lib/i18n";

interface OutdoorMapProps {
  locale: Locale;
  theme: "light" | "dark";
  sites: CampusSite[];
  selectedSiteId: string;
  userLat: number | null;
  userLng: number | null;
  onSiteSelect: (siteId: string) => void;
}

export default function OutdoorMap({
  locale,
  theme,
  sites,
  selectedSiteId,
  userLat,
  userLng,
  onSiteSelect,
}: OutdoorMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const siteLayerRef = useRef<any>(null);
  const siteMarkersRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function init() {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      const defaultSite = sites.find((site) => site.lat && site.lng) ?? sites[0];
      const center = defaultSite?.lat && defaultSite?.lng ? [defaultSite.lat, defaultSite.lng] : [45.008698, 78.349901];

      const map = leaflet.map(containerRef.current, {
        center,
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      tileLayerRef.current = leaflet.tileLayer(getTileUrl(theme), { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [sites, theme]);

  useEffect(() => {
    async function updateTileTheme() {
      if (!mapRef.current) return;
      const leaflet = await import("leaflet");

      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }

      tileLayerRef.current = leaflet.tileLayer(getTileUrl(theme), { maxZoom: 19 }).addTo(mapRef.current);
    }

    updateTileTheme();
  }, [theme]);

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
          .bindPopup(buildPopup(site, locale))
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
  }, [locale, onSiteSelect, selectedSiteId, sites, userLat, userLng]);

  useEffect(() => {
    async function syncSelectedSite() {
      if (!mapRef.current) return;
      const marker = siteMarkersRef.current.get(selectedSiteId);
      if (!marker) return;

      marker.openPopup();
      mapRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.35 });
    }

    syncSelectedSite();
  }, [selectedSiteId]);

  useEffect(() => {
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

      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }

      const points: [number, number][] = sites
        .filter((site): site is CampusSite & { lat: number; lng: number } => site.lat !== undefined && site.lng !== undefined)
        .map((site) => [site.lat, site.lng]);

      points.push([userLat, userLng]);

      if (targetSite) {
        routeLineRef.current = leaflet
          .polyline(
            [
              [userLat, userLng],
              [targetSite.lat!, targetSite.lng!],
            ],
            {
              color: "hsl(210 70% 45%)",
              weight: 4,
              opacity: 0.72,
              dashArray: "10 8",
            }
          )
          .addTo(map);
      }

      if (points.length > 1) {
        const bounds = leaflet.latLngBounds(points);
        map.fitBounds(bounds, { padding: [72, 72] });
      }
    }

    updateUserMarker();
  }, [selectedSiteId, sites, userLat, userLng]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-[28px]"
      role="application"
      aria-label="Outdoor map with university campus locations"
    />
  );
}

function buildPopup(site: CampusSite, locale: Locale) {
  const links = (site.photoLinks ?? [])
    .map(
      (link) =>
        `<a href="${link.url}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;justify-content:center;padding:8px 10px;border-radius:12px;background:#f4f7fb;color:#0f172a;text-decoration:none;font-size:12px;font-weight:600;">${escapeHtml(
          text(link.label, locale)
        )}</a>`
    )
    .join("");

  return `
    <div style="width:260px;padding:4px 2px;font-family:Inter,system-ui,sans-serif;">
      <div style="font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(text(site.name, locale))}</div>
      <div style="margin-top:6px;font-size:12px;line-height:1.45;color:#64748b;">${escapeHtml(text(site.address, locale))}</div>
      <div style="margin-top:8px;font-size:12px;line-height:1.5;color:#334155;">${escapeHtml(text(site.description, locale))}</div>
      ${links ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">${links}</div>` : ""}
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

function getTileUrl(theme: "light" | "dark") {
  if (theme === "dark") {
    return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  }

  return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
