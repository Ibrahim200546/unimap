"use client";

import type { ReactNode } from "react";
import { ExternalLink, TableProperties } from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { STUDENT_SCHEDULE } from "@/lib/student-schedule-data";

interface StudentSchedulePanelProps {
  locale: Locale;
}

const SCHEDULE_COPY = {
  ru: {
    title: "Расписание",
    subtitle: "Текущее студенческое расписание в формате таблицы.",
    count: "Пар в расписании",
    online: "Ссылка",
    columns: {
      id: "№",
      day: "День",
      lessonNumber: "Пара",
      time: "Время",
      subject: "Дисциплина",
      lessonType: "Вид занятия",
      teacher: "Преподаватель",
      room: "Аудитория",
      meeting: "Онлайн",
    },
  },
  kk: {
    title: "Кесте",
    subtitle: "Студенттің ағымдағы сабағы кесте түрінде.",
    count: "Сабақ саны",
    online: "Сілтеме",
    columns: {
      id: "№",
      day: "Күн",
      lessonNumber: "Сабақ",
      time: "Уақыт",
      subject: "Пән атауы",
      lessonType: "Сабақ түрі",
      teacher: "Оқытушы",
      room: "Аудитория",
      meeting: "Онлайн",
    },
  },
  en: {
    title: "Schedule",
    subtitle: "Current student schedule in table format.",
    count: "Lessons",
    online: "Link",
    columns: {
      id: "No.",
      day: "Day",
      lessonNumber: "Class",
      time: "Time",
      subject: "Subject",
      lessonType: "Type",
      teacher: "Teacher",
      room: "Room",
      meeting: "Online",
    },
  },
} as const;

export default function StudentSchedulePanel({ locale }: StudentSchedulePanelProps) {
  const copy = SCHEDULE_COPY[locale];

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TableProperties className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold">{copy.title}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>
          <div className="rounded-2xl bg-muted px-3 py-2 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {copy.count}
            </p>
            <p className="mt-1 text-sm font-semibold">{STUDENT_SCHEDULE.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-card p-3 shadow-sm">
        <div className="overflow-auto rounded-[22px] border border-border">
          <table className="min-w-[1040px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
              <tr className="border-b border-border">
                <Th>{copy.columns.id}</Th>
                <Th>{copy.columns.day}</Th>
                <Th>{copy.columns.lessonNumber}</Th>
                <Th>{copy.columns.time}</Th>
                <Th>{copy.columns.subject}</Th>
                <Th>{copy.columns.lessonType}</Th>
                <Th>{copy.columns.teacher}</Th>
                <Th>{copy.columns.room}</Th>
                <Th>{copy.columns.meeting}</Th>
              </tr>
            </thead>
            <tbody>
              {STUDENT_SCHEDULE.map((item) => (
                <tr key={item.id} className="border-b border-border/70 align-top last:border-0">
                  <Td className="font-semibold">{item.id}</Td>
                  <Td>{item.day}</Td>
                  <Td>{item.lessonNumber}</Td>
                  <Td className="whitespace-nowrap">{item.time}</Td>
                  <Td className="min-w-[240px]">{item.subject}</Td>
                  <Td>{item.lessonType}</Td>
                  <Td className="min-w-[220px] whitespace-pre-line">{item.teacher}</Td>
                  <Td className="min-w-[240px]">{item.room}</Td>
                  <Td>
                    {item.meetingUrl ? (
                      item.meetingUrl.startsWith("http") ? (
                        <a
                          href={item.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-muted"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {copy.online}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">{item.meetingUrl}</span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-foreground ${className ?? ""}`}>{children}</td>;
}
