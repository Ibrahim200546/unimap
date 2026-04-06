"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type MouseEvent,
  type TouchEvent,
  type WheelEvent,
} from "react";
import type { Room, FloorData } from "@/lib/building-data";
import { GRID } from "@/lib/building-data";

interface IndoorMapProps {
  floor: FloorData;
  selectedRoom: Room | null;
  highlightedRoom: Room | null;
  route: { x: number; y: number }[] | null;
  userPosition: { x: number; y: number } | null;
  onRoomClick: (room: Room) => void;
  onMapClick: (point: { x: number; y: number }) => void;
}

export default function IndoorMap({
  floor,
  selectedRoom,
  highlightedRoom,
  route,
  userPosition,
  onRoomClick,
  onMapClick,
}: IndoorMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Get CSS custom property color values
  const getColor = useCallback((varName: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    const root = document.documentElement;
    const val = getComputedStyle(root).getPropertyValue(varName).trim();
    if (!val) return fallback;
    return `hsl(${val})`;
  }, []);

  // ─── Drawing ───────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Apply transform
    const { x: tx, y: ty, scale } = transformRef.current;

    // Center the map
    const offsetX = (rect.width - GRID.width * scale) / 2 + tx;
    const offsetY = (rect.height - GRID.height * scale) / 2 + ty;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw building outline
    ctx.fillStyle = getColor("--map-corridor", "#e8ecf0");
    ctx.strokeStyle = getColor("--map-wall", "#2d3748");
    ctx.lineWidth = 2.5;
    roundRect(ctx, 30, 20, GRID.width - 60, GRID.height - 40, 8);
    ctx.fill();
    ctx.stroke();

    // Draw corridors
    for (const corridor of floor.corridors) {
      ctx.fillStyle = getColor("--map-corridor", "#e8ecf0");
      roundRect(ctx, corridor.x, corridor.y, corridor.width, corridor.height, 4);
      ctx.fill();
    }

    // Draw rooms
    for (const room of floor.rooms) {
      const isSelected = selectedRoom?.id === room.id;
      const isHighlighted = highlightedRoom?.id === room.id;

      // Room fill
      if (isHighlighted || isSelected) {
        ctx.fillStyle = getColor("--map-highlight", "#3ba776");
        ctx.globalAlpha = 0.2;
        roundRect(ctx, room.x, room.y, room.width, room.height, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Room background
      ctx.fillStyle = getRoomColor(room, getColor);
      roundRect(ctx, room.x, room.y, room.width, room.height, 6);
      ctx.fill();

      // Room border
      ctx.strokeStyle =
        isHighlighted || isSelected
          ? getColor("--map-highlight", "#3ba776")
          : getColor("--map-wall", "#2d3748");
      ctx.lineWidth = isHighlighted || isSelected ? 3 : 1.5;
      roundRect(ctx, room.x, room.y, room.width, room.height, 6);
      ctx.stroke();

      // Room label
      ctx.fillStyle = getColor("--map-wall", "#2d3748");
      ctx.font = `${isHighlighted || isSelected ? "bold " : ""}${
        room.width < 100 ? 11 : 13
      }px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        room.label,
        room.x + room.width / 2,
        room.y + room.height / 2
      );

      // Room type icon/subtitle
      if (room.type !== "classroom") {
        ctx.font = "10px Inter, system-ui, sans-serif";
        ctx.fillStyle = getColor("--muted-foreground", "#6b7280");
        const typeLabel = getRoomTypeLabel(room.type);
        ctx.fillText(
          typeLabel,
          room.x + room.width / 2,
          room.y + room.height / 2 + 16
        );
      }
    }

    // Draw route
    if (route && route.length > 1) {
      ctx.strokeStyle = getColor("--map-route", "#3178c6");
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(route[0].x, route[0].y);
      for (let i = 1; i < route.length; i++) {
        ctx.lineTo(route[i].x, route[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Route start marker
      ctx.fillStyle = getColor("--map-route", "#3178c6");
      ctx.beginPath();
      ctx.arc(route[0].x, route[0].y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(route[0].x, route[0].y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Route end marker
      const end = route[route.length - 1];
      ctx.fillStyle = getColor("--map-highlight", "#3ba776");
      ctx.beginPath();
      ctx.arc(end.x, end.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw user position
    if (userPosition) {
      ctx.fillStyle = getColor("--map-route", "#3178c6");
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(userPosition.x, userPosition.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = getColor("--map-route", "#3178c6");
      ctx.beginPath();
      ctx.arc(userPosition.x, userPosition.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(userPosition.x, userPosition.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }, [floor, selectedRoom, highlightedRoom, route, userPosition, getColor]);

  // ─── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    draw();
  }, [draw, transform]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  // ─── Coordinate transformation ────────────────────────────────────────
  const screenToMap = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const { x: tx, y: ty, scale } = transformRef.current;
      const offsetX = (rect.width - GRID.width * scale) / 2 + tx;
      const offsetY = (rect.height - GRID.height * scale) / 2 + ty;
      return {
        x: (clientX - rect.left - offsetX) / scale,
        y: (clientY - rect.top - offsetY) / scale,
      };
    },
    []
  );

  const findRoomAtPoint = useCallback(
    (px: number, py: number) => {
      return floor.rooms.find(
        (r) =>
          px >= r.x &&
          px <= r.x + r.width &&
          py >= r.y &&
          py <= r.y + r.height
      );
    },
    [floor.rooms]
  );

  // ─── Mouse Handlers ───────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      setIsPanning(true);
      panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    },
    [transform.x, transform.y]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning) return;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }));
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        const movedX = Math.abs(e.clientX - (panStart.current.x + transform.x));
        const movedY = Math.abs(e.clientY - (panStart.current.y + transform.y));
        if (movedX < 5 && movedY < 5) {
          // It's a click, not a pan
          const pt = screenToMap(e.clientX, e.clientY);
          const room = findRoomAtPoint(pt.x, pt.y);
          if (room) {
            onRoomClick(room);
          } else {
            onMapClick(pt);
          }
        }
      }
      setIsPanning(false);
    },
    [isPanning, transform.x, transform.y, screenToMap, findRoomAtPoint, onRoomClick, onMapClick]
  );

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setTransform((prev) => {
      const newScale = Math.max(0.4, Math.min(3, prev.scale - e.deltaY * 0.001));
      return { ...prev, scale: newScale };
    });
  }, []);

  // ─── Touch Handlers ───────────────────────────────────────────────────
  const lastTouchRef = useRef<{ x: number; y: number; dist: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        panStart.current = { x: t.clientX - transform.x, y: t.clientY - transform.y };
        lastTouchRef.current = { x: t.clientX, y: t.clientY, dist: 0 };
        setIsPanning(true);
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        lastTouchRef.current = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
          dist,
        };
      }
    },
    [transform.x, transform.y]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isPanning) {
        const t = e.touches[0];
        setTransform((prev) => ({
          ...prev,
          x: t.clientX - panStart.current.x,
          y: t.clientY - panStart.current.y,
        }));
      } else if (e.touches.length === 2 && lastTouchRef.current) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const scaleDelta = dist / (lastTouchRef.current.dist || 1);
        setTransform((prev) => ({
          ...prev,
          scale: Math.max(0.4, Math.min(3, prev.scale * scaleDelta)),
        }));
        lastTouchRef.current = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
          dist,
        };
      }
    },
    [isPanning]
  );

  const handleTouchEnd = useCallback(
    (e: globalThis.TouchEvent) => {
      if (isPanning && lastTouchRef.current && e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        const movedX = Math.abs(t.clientX - (lastTouchRef.current.x));
        const movedY = Math.abs(t.clientY - (lastTouchRef.current.y));
        if (movedX < 10 && movedY < 10) {
          const pt = screenToMap(t.clientX, t.clientY);
          const room = findRoomAtPoint(pt.x, pt.y);
          if (room) {
            onRoomClick(room);
          } else {
            onMapClick(pt);
          }
        }
      }
      setIsPanning(false);
      lastTouchRef.current = null;
    },
    [isPanning, screenToMap, findRoomAtPoint, onRoomClick, onMapClick]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: globalThis.TouchEvent) => handleTouchEnd(e);
    canvas.addEventListener("touchend", handler, { passive: false });
    return () => canvas.removeEventListener("touchend", handler);
  }, [handleTouchEnd]);

  // ─── Zoom to room ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!highlightedRoom || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const targetScale = 1.5;
    const roomCenterX = highlightedRoom.x + highlightedRoom.width / 2;
    const roomCenterY = highlightedRoom.y + highlightedRoom.height / 2;
    const newX = rect.width / 2 - roomCenterX * targetScale - (rect.width - GRID.width * targetScale) / 2;
    const newY = rect.height / 2 - roomCenterY * targetScale - (rect.height - GRID.height * targetScale) / 2;
    setTransform({ x: newX, y: newY, scale: targetScale });
  }, [highlightedRoom]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing touch-none"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsPanning(false)}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="w-full h-full"
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getRoomColor(room: Room, getColor: (v: string, f: string) => string): string {
  switch (room.type) {
    case "entrance":
      return getColor("--map-entrance", "#3ba776") + "30";
    case "elevator":
      return getColor("--map-elevator", "#64748b") + "28";
    case "stairs":
      return getColor("--map-stairs", "#d4913a") + "25";
    case "restroom":
      return getColor("--map-restroom", "#5b9ec4") + "25";
    case "library":
      return getColor("--map-library", "#4c7fb8") + "24";
    case "cafeteria":
      return getColor("--map-cafeteria", "#c78332") + "24";
    case "lab":
      return getColor("--map-lab", "#2f8f83") + "24";
    case "service":
      return getColor("--map-service", "#5d8b4d") + "24";
    case "office":
      return getColor("--map-office", "#9b8bb3") + "20";
    default:
      return getColor("--map-room", "#f0f4f8");
  }
}

function getRoomTypeLabel(type: Room["type"]): string {
  switch (type) {
    case "entrance":
      return "Вход";
    case "elevator":
      return "Лифт";
    case "stairs":
      return "Лестница";
    case "restroom":
      return "WC";
    case "library":
      return "Библио";
    case "cafeteria":
      return "Еда";
    case "lab":
      return "Lab";
    case "service":
      return "Сервис";
    case "office":
      return "Офис";
    default:
      return "";
  }
}
