"use client";

import {
  Accessibility,
  Clock,
  MapPin,
  Navigation,
  Route,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n";

interface OutdoorInfoCardProps {
  mode: "outdoor";
  locale: Locale;
  universityName: string;
  distance: string;
  time: string;
  onNavigate: () => void;
}

interface IndoorRouteInfoCardProps {
  mode: "route";
  locale: Locale;
  destinationName: string;
  destinationCode?: string;
  distance: string;
  time: string;
  profileLabel: string;
  floorHint?: string;
  steps: string[];
  onClose: () => void;
}

interface IndoorRoomInfoCardProps {
  mode: "room";
  locale: Locale;
  roomName: string;
  roomCode: string;
  roomType: string;
  floorLabel: string;
  description?: string;
  accessible?: boolean;
  onSetStart: () => void;
  onSetDestination: () => void;
  onClose: () => void;
}

type InfoCardProps =
  | OutdoorInfoCardProps
  | IndoorRouteInfoCardProps
  | IndoorRoomInfoCardProps;

const INFO_COPY = {
  ru: {
    nearbyText: "Кампус рядом. Можно перейти внутрь и продолжить навигацию по корпусу.",
    openIndoor: "Открыть карту корпуса",
    routeSteps: "Шаги маршрута",
    accessible: "Доступно",
    makeStart: "Сделать стартом",
    routeHere: "Маршрут сюда",
    closeRoute: "Закрыть маршрут",
    closeRoom: "Закрыть карточку помещения",
  },
  kk: {
    nearbyText: "Кампус жақын. Ішке өтіп, корпус ішіндегі навигацияны жалғастыруға болады.",
    openIndoor: "Корпус картасын ашу",
    routeSteps: "Маршрут қадамдары",
    accessible: "Қолжетімді",
    makeStart: "Бастау нүктесі ету",
    routeHere: "Осы жерге маршрут",
    closeRoute: "Маршрутты жабу",
    closeRoom: "Бөлме картасын жабу",
  },
} as const;

export default function InfoCard(props: InfoCardProps) {
  const copy = INFO_COPY[props.locale];

  if (props.mode === "outdoor") {
    return (
      <div className="rounded-[28px] border border-border bg-card p-5 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-foreground">
              {props.universityName}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{copy.nearbyText}</p>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5" />
                {props.distance}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {props.time}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={props.onNavigate}
          className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          type="button"
        >
          {copy.openIndoor}
        </button>
      </div>
    );
  }

  if (props.mode === "route") {
    return (
      <div className="rounded-[28px] border border-border bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
              <Route className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {props.destinationName}
                </h3>
                {props.destinationCode ? (
                  <Badge variant="outline">{props.destinationCode}</Badge>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{props.profileLabel}</Badge>
                {props.floorHint ? (
                  <span className="text-xs text-muted-foreground">
                    {props.floorHint}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{props.distance}</span>
                <span>·</span>
                <span>{props.time}</span>
              </div>
            </div>
          </div>
          <button
            onClick={props.onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={copy.closeRoute}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {copy.routeSteps}
          </p>
          <div className="mt-3 space-y-3">
            {props.steps.map((step, index) => (
              <div key={`${step}-${index}`} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <p className="text-sm text-foreground/90">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-border bg-card p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <span className="text-sm font-bold text-primary">{props.roomCode}</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {props.roomName}
              </h3>
              {props.accessible ? (
                <Badge variant="secondary" className="gap-1">
                  <Accessibility className="h-3 w-3" />
                  {copy.accessible}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {props.roomCode} · {props.floorLabel} · {props.roomType}
            </p>
            {props.description ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {props.description}
              </p>
            ) : null}
          </div>
        </div>
        <button
          onClick={props.onClose}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={copy.closeRoom}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={props.onSetStart}
          className="rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          type="button"
        >
          {copy.makeStart}
        </button>
        <button
          onClick={props.onSetDestination}
          className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          type="button"
        >
          {copy.routeHere}
        </button>
      </div>
    </div>
  );
}
