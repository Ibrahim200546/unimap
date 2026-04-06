import { NextRequest, NextResponse } from "next/server";

import { haversineDistance } from "@/lib/geo-utils";
import type { CampusTransitOption, CampusTransitResponse } from "@/lib/campus-transit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INFOBUS_BASE_URL = "https://infobus.kz";
const TALDYKORGAN_CITY_ID = 2;

interface PathPointApi {
  id: number;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface PathStepApi {
  departure_stop: PathPointApi;
  arrival_stop: PathPointApi;
  route: {
    id: number;
    name: string;
    number: string;
  };
  num_stops: number;
}

interface PredictionApi {
  routeId: number;
  prediction: number;
  mainPrediction?: boolean;
}

function parseCoordinate(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "SmartCampus/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`InfoBus request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function GET(request: NextRequest) {
  const sourceLat = parseCoordinate(request.nextUrl.searchParams.get("sourceLat"));
  const sourceLng = parseCoordinate(request.nextUrl.searchParams.get("sourceLng"));
  const targetLat = parseCoordinate(request.nextUrl.searchParams.get("targetLat"));
  const targetLng = parseCoordinate(request.nextUrl.searchParams.get("targetLng"));

  if (sourceLat === null || sourceLng === null || targetLat === null || targetLng === null) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const pathOptions = await fetchJson<PathStepApi[][]>(
      `${INFOBUS_BASE_URL}/cities/${TALDYKORGAN_CITY_ID}/pathsbwpoints?sourceLat=${sourceLat}&sourceLng=${sourceLng}&targetLat=${targetLat}&targetLng=${targetLng}`
    );

    const departureStopIds = [...new Set(pathOptions.map((option) => option[0]?.departure_stop.id).filter(Boolean))];
    const predictionEntries = await Promise.all(
      departureStopIds.map(async (stopId) => {
        const predictions = await fetchJson<PredictionApi[]>(
          `${INFOBUS_BASE_URL}/cities/${TALDYKORGAN_CITY_ID}/stations/${stopId}/prediction`
        ).catch(() => []);

        return [stopId, predictions] as const;
      })
    );

    const predictionMap = new Map<number, PredictionApi[]>(predictionEntries);

    const options: CampusTransitOption[] = pathOptions
      .filter((option) => option.length > 0)
      .map((option, index) => {
        const firstLeg = option[0];
        const lastLeg = option[option.length - 1];
        const stopPredictions = predictionMap.get(firstLeg.departure_stop.id) ?? [];
        const bestPrediction =
          stopPredictions
            .filter((entry) => entry.routeId === firstLeg.route.id && entry.mainPrediction !== false)
            .sort((left, right) => left.prediction - right.prediction)[0] ??
          stopPredictions
            .filter((entry) => entry.routeId === firstLeg.route.id)
            .sort((left, right) => left.prediction - right.prediction)[0] ??
          null;

        const walkingToStopMeters = haversineDistance(
          sourceLat,
          sourceLng,
          firstLeg.departure_stop.location.lat,
          firstLeg.departure_stop.location.lng
        );
        const walkingFromArrivalMeters = haversineDistance(
          lastLeg.arrival_stop.location.lat,
          lastLeg.arrival_stop.location.lng,
          targetLat,
          targetLng
        );
        const transfers = Math.max(option.length - 1, 0);
        const totalStops = option.reduce((sum, leg) => sum + leg.num_stops, 0);
        const score =
          (bestPrediction?.prediction ?? 3600) +
          walkingToStopMeters / 1.35 +
          walkingFromArrivalMeters / 1.35 +
          transfers * 240;

        return {
          id: `option-${index + 1}`,
          score,
          transfers,
          totalStops,
          departureStopId: firstLeg.departure_stop.id,
          departureStopName: firstLeg.departure_stop.name,
          departureStopLat: firstLeg.departure_stop.location.lat,
          departureStopLng: firstLeg.departure_stop.location.lng,
          arrivalStopId: lastLeg.arrival_stop.id,
          arrivalStopName: lastLeg.arrival_stop.name,
          arrivalStopLat: lastLeg.arrival_stop.location.lat,
          arrivalStopLng: lastLeg.arrival_stop.location.lng,
          firstRouteId: firstLeg.route.id,
          firstRouteName: firstLeg.route.name,
          firstRouteNumber: firstLeg.route.number,
          nextArrivalSeconds: bestPrediction?.prediction ?? null,
          walkingToStopMeters,
          walkingFromArrivalMeters,
          legs: option.map((leg) => ({
            routeId: leg.route.id,
            routeName: leg.route.name,
            routeNumber: leg.route.number,
            departureStopName: leg.departure_stop.name,
            arrivalStopName: leg.arrival_stop.name,
            stopCount: leg.num_stops,
          })),
        };
      })
      .sort((left, right) => left.score - right.score)
      .slice(0, 5);

    const payload: CampusTransitResponse = {
      provider: "infobus",
      cityId: TALDYKORGAN_CITY_ID,
      updatedAt: new Date().toISOString(),
      source: { lat: sourceLat, lng: sourceLng },
      target: { lat: targetLat, lng: targetLng },
      options,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load campus transit",
      },
      { status: 502 }
    );
  }
}
