"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { Room } from "@/lib/building-data";
import {
  getRoomDisplayName,
  getRoomTypeLabel,
  searchRooms,
} from "@/lib/building-data";

interface SearchBarProps {
  onSelect: (room: Room) => void;
  placeholder?: string;
}

export default function SearchBar({
  onSelect,
  placeholder = "Найдите аудиторию, столовую или сервис...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Room[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length > 0) {
      setResults(searchRooms(query));
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (room: Room) => {
    onSelect(room);
    setQuery(room.label);
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
      <div className="flex items-center bg-card rounded-xl shadow-lg border border-border px-4 py-3">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground ml-3 text-sm focus:outline-none"
          aria-label="Поиск по кампусу"
          role="combobox"
          aria-expanded={isOpen}
        />
        {query && (
          <button
            onClick={clear}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
          role="listbox"
        >
          {results.map((room) => (
            <li key={room.id}>
              <button
                onClick={() => handleSelect(room)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
                role="option"
                aria-selected={false}
                type="button"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold shrink-0">
                  {room.label.slice(0, 3)}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {getRoomDisplayName(room)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {room.label} &middot; {room.floor} этаж &middot;{" "}
                    {getRoomTypeLabel(room.type)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.trim().length > 0 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg p-4 z-50">
          <p className="text-sm text-muted-foreground text-center">
            Ничего не найдено. Попробуйте номер аудитории или название сервиса.
          </p>
        </div>
      )}
    </div>
  );
}
