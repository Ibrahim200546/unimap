"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import {
  getFloorLabel,
  getRoomDisplayName,
  getRoomTypeLabel,
  searchRooms,
  type Room,
} from "@/lib/building-data";
import type { Locale } from "@/lib/i18n";

interface SearchBarProps {
  locale: Locale;
  onSelect: (room: Room) => void;
}

const SEARCH_COPY = {
  ru: {
    placeholder: "Найдите аудиторию, столовую или сервис...",
    aria: "Поиск по кампусу",
    empty: "Ничего не найдено. Попробуйте номер аудитории или название сервиса.",
    clear: "Очистить поиск",
  },
  kk: {
    placeholder: "Аудиторияны, асхананы немесе сервисті табыңыз...",
    aria: "Кампус бойынша іздеу",
    empty: "Ештеңе табылмады. Аудитория нөмірін немесе сервис атауын қолданып көріңіз.",
    clear: "Іздеуді тазарту",
  },
} as const;

export default function SearchBar({ locale, onSelect }: SearchBarProps) {
  const copy = SEARCH_COPY[locale];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Room[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim()) {
      setResults(searchRooms(query));
      setIsOpen(true);
      return;
    }

    setResults([]);
    setIsOpen(false);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (room: Room) => {
    onSelect(room);
    setQuery(getRoomDisplayName(room, locale));
    setIsOpen(false);
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={copy.placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label={copy.aria}
          role="combobox"
          aria-expanded={isOpen}
        />
        {query ? (
          <button
            onClick={clear}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={copy.clear}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isOpen && results.length > 0 ? (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
          role="listbox"
        >
          {results.map((room) => (
            <li key={room.id}>
              <button
                onClick={() => handleSelect(room)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                role="option"
                aria-selected={false}
                type="button"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                  {room.label}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {getRoomDisplayName(room, locale)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {getFloorLabel(room.floor, locale)} ·{" "}
                    {getRoomTypeLabel(room.type, locale)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {isOpen && query.trim() && results.length === 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-card p-4 shadow-xl">
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        </div>
      ) : null}
    </div>
  );
}
