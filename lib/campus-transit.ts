export interface CampusTransitPoint {
  lat: number;
  lng: number;
}

export interface CampusTransitLiveBus {
  id: number;
  label: string;
  lat: number;
  lng: number;
  speed: number;
  direction: number;
  offline: boolean;
  distanceToDepartureStopMeters: number;
}

export interface CampusTransitLeg {
  routeId: number;
  routeName: string;
  routeNumber: string;
  departureStopName: string;
  arrivalStopName: string;
  stopCount: number;
}

export interface CampusTransitOption {
  id: string;
  score: number;
  transfers: number;
  totalStops: number;
  departureStopId: number;
  departureStopName: string;
  departureStopLat: number;
  departureStopLng: number;
  arrivalStopId: number;
  arrivalStopName: string;
  arrivalStopLat: number;
  arrivalStopLng: number;
  firstRouteId: number;
  firstRouteName: string;
  firstRouteNumber: string;
  nextArrivalSeconds: number | null;
  walkingToStopMeters: number;
  walkingFromArrivalMeters: number;
  routeSegment: CampusTransitPoint[];
  liveBuses: CampusTransitLiveBus[];
  activeBusCount: number;
  legs: CampusTransitLeg[];
}

export interface CampusTransitResponse {
  provider: "infobus";
  cityId: number;
  updatedAt: string;
  source: {
    lat: number;
    lng: number;
  };
  target: {
    lat: number;
    lng: number;
  };
  options: CampusTransitOption[];
}
