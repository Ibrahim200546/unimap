"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import type { CampusTransitOption } from "@/lib/campus-transit";
import type { Locale } from "@/lib/i18n";

interface CampusTransitLiveMapProps {
  locale: Locale;
  option: CampusTransitOption;
}

export default function CampusTransitLiveMap({
  locale,
  option,
}: CampusTransitLiveMapProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const overlayLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function init() {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      const center = option.routeSegment[0] ?? {
        lat: option.departureStopLat,
        lng: option.departureStopLng,
      };

      const map = leaflet.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      tileLayerRef.current = leaflet
        .tileLayer(getTileUrl(resolvedTheme === "dark"), {
          maxZoom: 19,
          subdomains: "abcd",
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
  }, [option.departureStopLat, option.departureStopLng, option.routeSegment, resolvedTheme]);

  useEffect(() => {
    async function syncTheme() {
      if (!mapRef.current) return;
      const leaflet = await import("leaflet");

      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }

      tileLayerRef.current = leaflet
        .tileLayer(getTileUrl(resolvedTheme === "dark"), {
          maxZoom: 19,
          subdomains: "abcd",
        })
        .addTo(mapRef.current);
    }

    syncTheme();
  }, [resolvedTheme]);

  useEffect(() => {
    async function updateOverlay() {
      if (!mapRef.current) return;

      const leaflet = await import("leaflet");
      const map = mapRef.current;

      if (overlayLayerRef.current) {
        map.removeLayer(overlayLayerRef.current);
      }

      const layer = leaflet.layerGroup().addTo(map);
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
          opacity: 0.92,
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
        .bindTooltip(locale === "ru" ? "Посадка" : "Отыру", {
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
        .bindTooltip(locale === "ru" ? "Выход" : "Түсу", {
          direction: "top",
          offset: [0, -8],
        });

      const visibleBusPoints: [number, number][] = [];

      option.liveBuses.forEach((bus) => {
        visibleBusPoints.push([bus.lat, bus.lng]);

        leaflet
          .marker([bus.lat, bus.lng], {
            icon: leaflet.divIcon({
              className: "campus-transit-bus",
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
              <div style="font-size:13px;font-weight:700;">${escapeHtml(bus.label)}</div>
              <div style="margin-top:4px;font-size:12px;color:#64748b;">
                ${bus.offline ? (locale === "ru" ? "Оффлайн" : "Оффлайн") : locale === "ru" ? "На линии" : "Желіде"}
              </div>
              <div style="margin-top:4px;font-size:12px;color:#334155;">
                ${locale === "ru" ? "Скорость" : "Жылдамдық"}: ${Math.round(bus.speed)} км/ч
              </div>
            </div>
          `);
      });

      overlayLayerRef.current = layer;

      const bounds = leaflet.latLngBounds([...segment, ...visibleBusPoints]);
      map.fitBounds(bounds, {
        padding: [28, 28],
        maxZoom: 16,
      });
    }

    updateOverlay();
  }, [locale, option]);

  return (
    <div
      ref={containerRef}
      className="h-[260px] w-full rounded-[24px]"
      role="img"
      aria-label="Live transit route preview"
    />
  );
}

function getTileUrl(isDark: boolean) {
  return isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
