'use client'

import { useState } from 'react'
import {
  Bell,
  CalendarClock,
  CircleCheckBig,
  MapPinned,
  MessageSquareText,
  PackageSearch,
  Soup,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  BOOKING_SLOTS,
  CAMPUS_NEWS,
  DINING_MENU,
  LOST_AND_FOUND_ITEMS,
  TODAY_SCHEDULE,
} from '@/lib/campus-data'
import { getRoomById } from '@/lib/building-data'
import { cn } from '@/lib/utils'

interface CampusServicesPanelProps {
  onOpenRouteToRoom: (roomId: string) => void
}

interface FeedbackFormState {
  topic: string
  message: string
}

export default function CampusServicesPanel({
  onOpenRouteToRoom,
}: CampusServicesPanelProps) {
  const [reservedSlots, setReservedSlots] = useState<string[]>([])
  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormState>({
    topic: '',
    message: '',
  })
  const [feedbackSent, setFeedbackSent] = useState(false)

  const handleReserve = (slotId: string) => {
    setReservedSlots((current) =>
      current.includes(slotId) ? current : [...current, slotId]
    )
  }

  const handleFeedbackSubmit = () => {
    if (!feedbackForm.topic.trim() || !feedbackForm.message.trim()) return

    setFeedbackSent(true)
    setFeedbackForm({ topic: '', message: '' })
  }

  return (
    <div className="rounded-[28px] border border-border bg-card/95 p-4 shadow-2xl backdrop-blur max-h-[72vh] overflow-y-auto space-y-4">
      <section className="rounded-2xl border border-border bg-background/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Smart Campus
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              Сервисы кампуса в одном месте
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Проверяй события, бронируй комнаты и сразу строй маршрут до нужной
              точки без переключения между экранами.
            </p>
          </div>
          <Badge className="shrink-0" variant="secondary">
            6 сервисов
          </Badge>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background/70 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Ближайшие занятия
          </h3>
        </div>
        <div className="space-y-2">
          {TODAY_SCHEDULE.map((item) => {
            const room = getRoomById(item.roomId)

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.time} · {item.group} · {item.teacher}
                    </p>
                    <p className="mt-2 text-xs text-foreground/80">
                      {room?.name ?? item.roomId}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenRouteToRoom(item.roomId)}
                    type="button"
                  >
                    <MapPinned className="h-4 w-4" />
                    Маршрут
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background/70 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Новости и объявления
          </h3>
        </div>
        <div className="space-y-2">
          {CAMPUS_NEWS.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.summary}
                  </p>
                </div>
                <Badge
                  variant={item.priority === 'high' ? 'destructive' : 'secondary'}
                >
                  {item.priority === 'high'
                    ? 'Важно'
                    : item.priority === 'medium'
                      ? 'Новое'
                      : 'Обновление'}
                </Badge>
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {item.time}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background/70 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Soup className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Меню столовой</h3>
        </div>
        <div className="space-y-2">
          {DINING_MENU.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card px-3 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline">{item.badge}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.price}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenRouteToRoom('CAFE')}
                type="button"
              >
                <MapPinned className="h-4 w-4" />
                К столовой
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background/70 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Бронирование аудиторий
          </h3>
        </div>
        <div className="space-y-2">
          {BOOKING_SLOTS.map((slot) => {
            const isReserved = reservedSlots.includes(slot.id)

            return (
              <div
                key={slot.id}
                className="rounded-xl border border-border bg-card px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {slot.title}
                      </p>
                      <Badge
                        variant={
                          slot.status === 'available' ? 'secondary' : 'outline'
                        }
                      >
                        {isReserved
                          ? 'Забронировано'
                          : slot.status === 'available'
                            ? 'Доступно'
                            : 'Занято'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {slot.timeLabel}
                    </p>
                    <p className="mt-2 text-xs text-foreground/80">
                      {slot.features.join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenRouteToRoom(slot.roomId)}
                      type="button"
                    >
                      <MapPinned className="h-4 w-4" />
                      Найти
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReserve(slot.id)}
                      disabled={slot.status === 'busy' || isReserved}
                      type="button"
                    >
                      {isReserved ? 'Готово' : 'Забронировать'}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background/70 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <PackageSearch className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Lost &amp; Found
          </h3>
        </div>
        <div className="space-y-2">
          {LOST_AND_FOUND_ITEMS.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.locationNote}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {item.reportedAt}
                  </p>
                </div>
                <Badge
                  className={cn(
                    item.status === 'ready' && 'bg-accent text-accent-foreground'
                  )}
                  variant={item.status === 'new' ? 'secondary' : 'outline'}
                >
                  {item.status === 'new'
                    ? 'Новое'
                    : item.status === 'processing'
                      ? 'В обработке'
                      : 'Можно забрать'}
                </Badge>
              </div>
              {item.roomId ? (
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenRouteToRoom(item.roomId!)}
                  type="button"
                >
                  <MapPinned className="h-4 w-4" />
                  Открыть точку на карте
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background/70 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Обратная связь и обращения
          </h3>
        </div>
        <div className="space-y-3">
          <Input
            placeholder="Тема обращения"
            value={feedbackForm.topic}
            onChange={(event) =>
              setFeedbackForm((current) => ({
                ...current,
                topic: event.target.value,
              }))
            }
          />
          <Textarea
            placeholder="Опишите проблему, вопрос или пожелание"
            value={feedbackForm.message}
            onChange={(event) =>
              setFeedbackForm((current) => ({
                ...current,
                message: event.target.value,
              }))
            }
          />
          <div className="flex items-center justify-between gap-3">
            <Button onClick={handleFeedbackSubmit} type="button">
              Отправить обращение
            </Button>
            {feedbackSent ? (
              <span className="inline-flex items-center gap-2 text-xs text-accent">
                <CircleCheckBig className="h-4 w-4" />
                Принято в сервисный центр
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Ответ придёт в приложение и на почту.
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
