"use client";

import { useEffect, useRef } from "react";

interface OutdoorMapProps {
  userLat: number | null;
  userLng: number | null;
  uniLat: number;
  uniLng: number;
  uniName: string;
  theme: "light" | "dark";
}

export default function OutdoorMap({
  userLat,
  userLng,
  uniLat,
  uniLng,
  uniName,
  theme,
}: OutdoorMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<any>(null);
  const uniMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function init() {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      const map = leaflet.map(containerRef.current, {
        center: [uniLat, uniLng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      tileLayerRef.current = leaflet
        .tileLayer(getTileUrl(theme), {
          maxZoom: 19,
        })
        .addTo(map);

      const uniIcon = leaflet.divIcon({
        className: "uni-marker",
        html: `
          <div style="
            width: 38px;
            height: 38px;
            background: hsl(210 70% 45%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.22);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 22h20"/>
              <path d="M6 18V8"/>
              <path d="M18 18V8"/>
              <path d="M2 10l10-6 10 6"/>
              <path d="M10 18v-4h4v4"/>
            </svg>
          </div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      uniMarkerRef.current = leaflet
        .marker([uniLat, uniLng], { icon: uniIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family: system-ui, sans-serif; padding: 4px;">
            <strong style="font-size: 14px;">${uniName}</strong>
          </div>`
        );

      leaflet
        .circle([uniLat, uniLng], {
          radius: 55,
          color: "hsl(210 70% 45%)",
          fillColor: "hsl(210 70% 45%)",
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: "6 4",
        })
        .addTo(map);

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
  }, [theme, uniLat, uniLng, uniName]);

  useEffect(() => {
    async function updateTileTheme() {
      if (!mapRef.current) return;
      const leaflet = await import("leaflet");

      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }

      tileLayerRef.current = leaflet
        .tileLayer(getTileUrl(theme), { maxZoom: 19 })
        .addTo(mapRef.current);
    }

    updateTileTheme();
  }, [theme]);

  useEffect(() => {
    if (!mapRef.current) return;

    async function updateUserMarker() {
      const leaflet = await import("leaflet");
      const map = mapRef.current;

      if (userLat === null || userLng === null) return;

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
        userMarkerRef.current = leaflet
          .marker([userLat, userLng], { icon: userIcon })
          .addTo(map);
      }

      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
      }

      routeLineRef.current = leaflet
        .polyline(
          [
            [userLat, userLng],
            [uniLat, uniLng],
          ],
          {
            color: "hsl(210 70% 45%)",
            weight: 4,
            opacity: 0.72,
            dashArray: "10 8",
          }
        )
        .addTo(map);

      const bounds = leaflet.latLngBounds(
        [userLat, userLng],
        [uniLat, uniLng]
      );
      map.fitBounds(bounds, { padding: [60, 60] });
    }

    updateUserMarker();
  }, [uniLat, uniLng, userLat, userLng]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-[28px]"
      role="application"
      aria-label="Outdoor map showing the campus"
    />
  );
}

function getTileUrl(theme: "light" | "dark") {
  if (theme === "dark") {
    return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  }

  return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
}
