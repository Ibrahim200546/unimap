'use client'

import {
  Accessibility,
  Clock,
  MapPin,
  Navigation,
  Route,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'

interface OutdoorInfoCardProps {
  mode: 'outdoor'
  universityName: string
  distance: string
  time: string
  onNavigate: () => void
}

interface IndoorRouteInfoCardProps {
  mode: 'route'
  destinationName: string
  destinationCode?: string
  distance: string
  time: string
  profileLabel: string
  floorHint?: string
  steps: string[]
  onClose: () => void
}

interface IndoorRoomInfoCardProps {
  mode: 'room'
  roomName: string
  roomCode: string
  roomType: string
  floor: number
  description?: string
  accessible?: boolean
  onSetStart: () => void
  onSetDestination: () => void
  onClose: () => void
}

type InfoCardProps =
  | OutdoorInfoCardProps
  | IndoorRouteInfoCardProps
  | IndoorRoomInfoCardProps

export default function InfoCard(props: InfoCardProps) {
  if (props.mode === 'outdoor') {
    return (
      <div className="bg-card rounded-2xl shadow-lg border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {props.universityName}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Кампус рядом. Можно войти в корпус и продолжить навигацию внутри.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Navigation className="w-3.5 h-3.5" />
                {props.distance}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {props.time}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={props.onNavigate}
          className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          type="button"
        >
          Перейти к навигации в корпусе
        </button>
      </div>
    )
  }

  if (props.mode === 'route') {
    return (
      <div className="bg-card rounded-2xl shadow-lg border border-border p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 shrink-0">
              <Route className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground">
                  {props.destinationName}
                </h3>
                {props.destinationCode ? (
                  <Badge variant="outline">{props.destinationCode}</Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary">{props.profileLabel}</Badge>
                {props.floorHint ? (
                  <span className="text-xs text-muted-foreground">
                    {props.floorHint}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {props.distance}
                </span>
                <span className="text-xs text-muted-foreground">&middot;</span>
                <span className="text-xs text-muted-foreground">
                  {props.time}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={props.onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Закрыть маршрут"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl border border-border bg-background/70 px-3 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Шаги маршрута
          </p>
          <div className="mt-3 space-y-2">
            {props.steps.map((step, index) => (
              <div key={`${step}-${index}`} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {index + 1}
                </span>
                <p className="text-sm text-foreground/90">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 shrink-0">
            <span className="text-sm font-bold text-primary">
              {props.roomCode}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">
                {props.roomName}
              </h3>
              {props.accessible ? (
                <Badge className="gap-1" variant="secondary">
                  <Accessibility className="h-3 w-3" />
                  Доступно
                </Badge>
              ) : null}
            </div>
            <span className="text-xs text-muted-foreground">
              {props.roomCode} &middot; {props.floor} этаж &middot;{' '}
              {props.roomType}
            </span>
            {props.description ? (
              <p className="mt-2 text-xs text-muted-foreground max-w-[22rem]">
                {props.description}
              </p>
            ) : null}
          </div>
        </div>
        <button
          onClick={props.onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Закрыть карточку помещения"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={props.onSetStart}
          className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium text-xs hover:bg-muted transition-colors"
          type="button"
        >
          Сделать стартом
        </button>
        <button
          onClick={props.onSetDestination}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition-opacity"
          type="button"
        >
          Маршрут сюда
        </button>
      </div>
    </div>
  )
}
