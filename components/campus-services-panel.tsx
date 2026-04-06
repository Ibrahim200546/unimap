"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  BusFront,
  CalendarClock,
  CircleCheckBig,
  MapPinned,
  MessageSquareText,
  PackageSearch,
  Soup,
} from "lucide-react";

import CampusTransitPanel from "@/components/campus-transit-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BOOKING_SLOTS,
  CAMPUS_NEWS,
  DINING_MENU,
  LOST_AND_FOUND_ITEMS,
  TODAY_SCHEDULE,
} from "@/lib/campus-data";
import type { CampusTransitMapOverlay } from "@/lib/campus-transit";
import { getRoomById, getRoomDisplayName } from "@/lib/building-data";
import type { CampusSite } from "@/lib/campus-sites";
import type { Locale } from "@/lib/i18n";
import { text } from "@/lib/i18n";

interface CampusServicesPanelProps {
  locale: Locale;
  onOpenRouteToRoom: (roomId: string) => void;
  campusSites: CampusSite[];
  activeOutdoorSiteId: string;
  userLat: number | null;
  userLng: number | null;
  onSelectOutdoorSite: (siteId: string) => void;
  onTransitOverlayChange: (overlay: CampusTransitMapOverlay | null) => void;
}

type ServiceView =
  | "schedule"
  | "transport"
  | "news"
  | "dining"
  | "booking"
  | "lost"
  | "feedback";

interface FeedbackFormState {
  topic: string;
  message: string;
}

const SERVICES_COPY = {
  ru: {
    title: "Сервисы кампуса",
    subtitle: "Открывайте только нужный сервис, а маршрут до точки стройте в один клик.",
    route: "Маршрут",
    find: "Найти",
    reserve: "Забронировать",
    reserved: "Забронировано",
    done: "Готово",
    available: "Доступно",
    busy: "Занято",
    important: "Важно",
    fresh: "Новое",
    update: "Обновление",
    take: "Можно забрать",
    processing: "В обработке",
    send: "Отправить обращение",
    accepted: "Принято в сервисный центр",
    responseHint: "Ответ придёт в приложение и на почту.",
    topicPlaceholder: "Тема обращения",
    messagePlaceholder: "Опишите проблему, вопрос или пожелание",
    tabs: {
      schedule: "Расписание",
      news: "Новости",
      dining: "Столовая",
      booking: "Бронирование",
      lost: "Lost & Found",
      feedback: "Обращения",
    },
    headings: {
      schedule: "Ближайшие занятия",
      news: "Новости и объявления",
      dining: "Меню столовой",
      booking: "Бронирование аудиторий",
      lost: "Бюро находок",
      feedback: "Обратная связь",
    },
  },
  kk: {
    title: "Кампус сервистері",
    subtitle: "Тек керекті сервисті ашыңыз, ал нүктеге маршрутты бір батырмамен құрыңыз.",
    route: "Маршрут",
    find: "Табу",
    reserve: "Броньдау",
    reserved: "Броньдалды",
    done: "Дайын",
    available: "Қолжетімді",
    busy: "Бос емес",
    important: "Маңызды",
    fresh: "Жаңа",
    update: "Жаңарту",
    take: "Алып кетуге болады",
    processing: "Өңделуде",
    send: "Өтініш жіберу",
    accepted: "Қызмет орталығына қабылданды",
    responseHint: "Жауап қосымшаға және поштаға келеді.",
    topicPlaceholder: "Өтініш тақырыбы",
    messagePlaceholder: "Мәселені, сұрақты немесе ұсынысты жазыңыз",
    tabs: {
      schedule: "Кесте",
      news: "Жаңалықтар",
      dining: "Асхана",
      booking: "Бронь",
      lost: "Табылған заттар",
      feedback: "Өтініштер",
    },
    headings: {
      schedule: "Жақын сабақтар",
      news: "Жаңалықтар мен хабарламалар",
      dining: "Асхана мәзірі",
      booking: "Аудитория броні",
      lost: "Табылған заттар бөлімі",
      feedback: "Кері байланыс",
    },
  },
} as const;

export default function CampusServicesPanel({
  locale,
  onOpenRouteToRoom,
  campusSites,
  activeOutdoorSiteId,
  userLat,
  userLng,
  onSelectOutdoorSite,
  onTransitOverlayChange,
}: CampusServicesPanelProps) {
  const copy = SERVICES_COPY[locale];
  const transportLabel = locale === "ru" ? "Транспорт" : "Көлік";
  const transportHeading =
    locale === "ru" ? "Межкорпусной транспорт" : "Корпус аралық көлік";
  const [activeView, setActiveView] = useState<ServiceView>("schedule");
  const [reservedSlots, setReservedSlots] = useState<string[]>([]);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormState>({
    topic: "",
    message: "",
  });
  const [feedbackSent, setFeedbackSent] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "schedule" as const, icon: CalendarClock, label: copy.tabs.schedule },
      { id: "transport" as const, icon: BusFront, label: transportLabel },
      { id: "news" as const, icon: Bell, label: copy.tabs.news },
      { id: "dining" as const, icon: Soup, label: copy.tabs.dining },
      { id: "booking" as const, icon: CalendarClock, label: copy.tabs.booking },
      { id: "lost" as const, icon: PackageSearch, label: copy.tabs.lost },
      { id: "feedback" as const, icon: MessageSquareText, label: copy.tabs.feedback },
    ],
    [copy, transportLabel]
  );

  const handleReserve = (slotId: string) => {
    setReservedSlots((current) =>
      current.includes(slotId) ? current : [...current, slotId]
    );
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackForm.topic.trim() || !feedbackForm.message.trim()) return;

    setFeedbackSent(true);
    setFeedbackForm({ topic: "", message: "" });
  };

  const renderContent = () => {
    if (activeView === "schedule") {
      return (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {copy.headings.schedule}
          </h3>
          {TODAY_SCHEDULE.map((item) => {
            const room = getRoomById(item.roomId);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-background/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {text(item.title, locale)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.time} · {item.group} · {item.teacher}
                    </p>
                    {room ? (
                      <p className="mt-2 text-xs text-foreground/80">
                        {getRoomDisplayName(room, locale)}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenRouteToRoom(item.roomId)}
                    type="button"
                  >
                    <MapPinned className="h-4 w-4" />
                    {copy.route}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeView === "news") {
      return (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {copy.headings.news}
          </h3>
          {CAMPUS_NEWS.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-background/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {text(item.title, locale)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {text(item.summary, locale)}
                  </p>
                </div>
                <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                  {item.priority === "high"
                    ? copy.important
                    : item.priority === "medium"
                    ? copy.fresh
                    : copy.update}
                </Badge>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {text(item.time, locale)}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (activeView === "transport") {
      return (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {transportHeading}
          </h3>
          <CampusTransitPanel
            locale={locale}
            campusSites={campusSites}
            activeTargetSiteId={activeOutdoorSiteId}
            userLat={userLat}
            userLng={userLng}
            onTargetSiteChange={onSelectOutdoorSite}
            onTransitOverlayChange={onTransitOverlayChange}
          />
        </div>
      );
    }

    if (activeView === "dining") {
      return (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {copy.headings.dining}
          </h3>
          {DINING_MENU.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {text(item.name, locale)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{text(item.badge, locale)}</Badge>
                  <span className="text-xs text-muted-foreground">{item.price}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenRouteToRoom("CAFE")}
                type="button"
              >
                <MapPinned className="h-4 w-4" />
                {copy.route}
              </Button>
            </div>
          ))}
        </div>
      );
    }

    if (activeView === "booking") {
      return (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {copy.headings.booking}
          </h3>
          {BOOKING_SLOTS.map((slot) => {
            const isReserved = reservedSlots.includes(slot.id);

            return (
              <div
                key={slot.id}
                className="rounded-2xl border border-border bg-background/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {text(slot.title, locale)}
                      </p>
                      <Badge
                        variant={
                          isReserved
                            ? "secondary"
                            : slot.status === "available"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {isReserved
                          ? copy.reserved
                          : slot.status === "available"
                          ? copy.available
                          : copy.busy}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {text(slot.timeLabel, locale)}
                    </p>
                    <p className="mt-2 text-xs text-foreground/80">
                      {slot.features.map((feature) => text(feature, locale)).join(" · ")}
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
                      {copy.find}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReserve(slot.id)}
                      disabled={slot.status === "busy" || isReserved}
                      type="button"
                    >
                      {isReserved ? copy.done : copy.reserve}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeView === "lost") {
      return (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {copy.headings.lost}
          </h3>
          {LOST_AND_FOUND_ITEMS.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-background/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {text(item.title, locale)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {text(item.locationNote, locale)}
                  </p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {text(item.reportedAt, locale)}
                  </p>
                </div>
                <Badge variant={item.status === "new" ? "secondary" : "outline"}>
                  {item.status === "new"
                    ? copy.fresh
                    : item.status === "processing"
                    ? copy.processing
                    : copy.take}
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
                  {copy.route}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          {copy.headings.feedback}
        </h3>
        <div className="rounded-2xl border border-border bg-background/70 p-4">
          <div className="space-y-3">
            <Input
              placeholder={copy.topicPlaceholder}
              value={feedbackForm.topic}
              onChange={(event) =>
                setFeedbackForm((current) => ({
                  ...current,
                  topic: event.target.value,
                }))
              }
            />
            <Textarea
              placeholder={copy.messagePlaceholder}
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
                {copy.send}
              </Button>
              {feedbackSent ? (
                <span className="inline-flex items-center gap-2 text-xs text-accent">
                  <CircleCheckBig className="h-4 w-4" />
                  {copy.accepted}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {copy.responseHint}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-border bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Smart Campus
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              {copy.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>
          <Badge variant="secondary">{tabs.length}</Badge>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={[
                "inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-[28px] border border-border bg-card p-5 shadow-xl">
        {renderContent()}
      </div>
    </div>
  );
}
