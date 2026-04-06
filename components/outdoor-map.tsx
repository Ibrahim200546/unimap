"use client";

import { useEffect, useRef } from "react";

interface OutdoorMapProps {
  userLat: number | null;
  userLng: number | null;
  uniLat: number;
  uniLng: number;
  uniName: string;
}

export default function OutdoorMap({
  userLat,
  userLng,
  uniLat,
  uniLng,
  uniName,
}: OutdoorMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<any>(null);
  const uniMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

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

      leaflet
        .tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
        })
        .addTo(map);

      // University marker
      const uniIcon = leaflet.divIcon({
        className: "uni-marker",
        html: `<div style="
          width: 36px; height: 36px; 
          background: hsl(210 70% 45%); 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          display: flex; align-items: center; justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 22h20"/>
            <path d="M6 18V8"/>
            <path d="M18 18V8"/>
            <path d="M2 10l10-6 10 6"/>
            <path d="M10 18v-4h4v4"/>
          </svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      uniMarkerRef.current = leaflet
        .marker([uniLat, uniLng], { icon: uniIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family: Inter, system-ui, sans-serif; padding: 4px;">
            <strong style="font-size: 14px;">${uniName}</strong>
          </div>`
        );

      // Radius circle
      leaflet
        .circle([uniLat, uniLng], {
          radius: 50,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update user marker
  useEffect(() => {
    if (!mapRef.current) return;

    async function updateUser() {
      const leaflet = await import("leaflet");
      const map = mapRef.current!;

      if (userLat !== null && userLng !== null) {
        const userIcon = leaflet.divIcon({
          className: "user-marker",
          html: `<div style="
            width: 28px; height: 28px; 
            background: hsl(160 50% 42%); 
            border-radius: 50%; 
            border: 3px solid white; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          "></div>
          <div style="
            position: absolute; top: -8px; left: -8px;
            width: 44px; height: 44px;
            background: hsla(160, 50%, 42%, 0.15);
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

        // Draw route line
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
              opacity: 0.7,
              dashArray: "10 8",
            }
          )
          .addTo(map);

        // Fit bounds to show both markers
        const bounds = leaflet.latLngBounds(
          [userLat, userLng],
          [uniLat, uniLng]
        );
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    }

    updateUser();
  }, [userLat, userLng, uniLat, uniLng]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      role="application"
      aria-label="Outdoor map showing university location"
    />
  );
}
