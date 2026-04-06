"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
  type WheelEvent,
} from "react";

import {
  GRID,
  getRoomTypeLabel,
  type FloorData,
  type Room,
} from "@/lib/building-data";
import type { Locale } from "@/lib/i18n";

interface IndoorMapProps {
  locale: Locale;
  floor: FloorData;
  selectedRoom: Room | null;
  highlightedRoom: Room | null;
  route: { x: number; y: number }[] | null;
  userPosition: { x: number; y: number } | null;
  onRoomClick: (room: Room) => void;
  onMapClick: () => void;
}

interface Point {
  x: number;
  y: number;
}

export default function IndoorMap({
  locale,
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
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const transformRef = useRef(transform);
  const lastTouchRef = useRef<{ x: number; y: number; dist: number } | null>(
    null
  );

  transformRef.current = transform;

  const getColor = useCallback((varName: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();

    return value ? `hsl(${value})` : fallback;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const { x: tx, y: ty, scale } = transformRef.current;
    const offsetX = (rect.width - GRID.width * scale) / 2 + tx;
    const offsetY = (rect.height - GRID.height * scale) / 2 + ty;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const frameGradient = ctx.createLinearGradient(0, 0, GRID.width, GRID.height);
    frameGradient.addColorStop(0, getColor("--map-corridor", "#e9eff4"));
    frameGradient.addColorStop(1, getColor("--card", "#ffffff"));
    ctx.fillStyle = frameGradient;
    ctx.strokeStyle = getColor("--map-wall", "#334155");
    ctx.lineWidth = 2.5;
    roundRect(ctx, 24, 18, GRID.width - 48, GRID.height - 36, 18);
    ctx.fill();
    ctx.stroke();

    for (const corridor of floor.corridors) {
      ctx.fillStyle = getColor("--map-corridor", "#e9eff4");
      roundRect(ctx, corridor.x, corridor.y, corridor.width, corridor.height, 12);
      ctx.fill();
    }

    for (const room of floor.rooms) {
      const isSelected = selectedRoom?.id === room.id;
      const isHighlighted = highlightedRoom?.id === room.id;
      const roomCenterX = room.x + room.width / 2;
      const roomCenterY = room.y + room.height / 2;

      if (isSelected || isHighlighted) {
        ctx.fillStyle = getColor("--map-highlight", "#3ba776");
        ctx.globalAlpha = 0.16;
        roundRect(ctx, room.x - 4, room.y - 4, room.width + 8, room.height + 8, 16);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = getRoomColor(room, getColor);
      roundRect(ctx, room.x, room.y, room.width, room.height, 14);
      ctx.fill();

      ctx.strokeStyle =
        isSelected || isHighlighted
          ? getColor("--map-highlight", "#3ba776")
          : getColor("--map-wall", "#334155");
      ctx.lineWidth = isSelected || isHighlighted ? 2.6 : 1.4;
      roundRect(ctx, room.x, room.y, room.width, room.height, 14);
      ctx.stroke();

      ctx.fillStyle = getColor("--foreground", "#111827");
      ctx.font = `600 ${room.width < 105 ? 11 : 13}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(room.label, roomCenterX, roomCenterY - 7);

      if (room.type !== "classroom") {
        ctx.fillStyle = getColor("--muted-foreground", "#64748b");
        ctx.font = "10px system-ui, sans-serif";
        ctx.fillText(
          getRoomTypeLabel(room.type, locale),
          roomCenterX,
          roomCenterY + 11
        );
      }
    }

    if (route && route.length > 1) {
      ctx.strokeStyle = getColor("--map-route", "#2563eb");
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(route[0].x, route[0].y);

      for (let index = 1; index < route.length; index += 1) {
        ctx.lineTo(route[index].x, route[index].y);
      }

      ctx.stroke();
      ctx.setLineDash([]);

      const start = route[0];
      const end = route[route.length - 1];

      drawMarker(ctx, start.x, start.y, getColor("--map-route", "#2563eb"), 8);
      drawMarker(ctx, end.x, end.y, getColor("--map-highlight", "#3ba776"), 10);
    }

    if (userPosition) {
      ctx.fillStyle = getColor("--map-route", "#2563eb");
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.arc(userPosition.x, userPosition.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      drawMarker(ctx, userPosition.x, userPosition.y, getColor("--map-route", "#2563eb"), 9);
    }

    ctx.restore();
  }, [floor, getColor, highlightedRoom, locale, route, selectedRoom, userPosition]);

  useEffect(() => {
    draw();
  }, [draw, transform]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const screenToMap = useCallback((clientX: number, clientY: number): Point => {
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
  }, []);

  const findRoomAtPoint = useCallback(
    (point: Point) =>
      floor.rooms.find(
        (room) =>
          point.x >= room.x &&
          point.x <= room.x + room.width &&
          point.y >= room.y &&
          point.y <= room.y + room.height
      ),
    [floor.rooms]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      setIsPanning(true);
      panStart.current = {
        x: event.clientX - transform.x,
        y: event.clientY - transform.y,
      };
    },
    [transform.x, transform.y]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isPanning) return;

      setTransform((current) => ({
        ...current,
        x: event.clientX - panStart.current.x,
        y: event.clientY - panStart.current.y,
      }));
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (isPanning) {
        const movedX = Math.abs(event.clientX - (panStart.current.x + transform.x));
        const movedY = Math.abs(event.clientY - (panStart.current.y + transform.y));

        if (movedX < 5 && movedY < 5) {
          const point = screenToMap(event.clientX, event.clientY);
          const room = findRoomAtPoint(point);

          if (room) {
            onRoomClick(room);
          } else {
            onMapClick();
          }
        }
      }

      setIsPanning(false);
    },
    [findRoomAtPoint, isPanning, onMapClick, onRoomClick, screenToMap, transform.x, transform.y]
  );

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();

    setTransform((current) => ({
      ...current,
      scale: Math.max(0.45, Math.min(3, current.scale - event.deltaY * 0.0012)),
    }));
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        panStart.current = {
          x: touch.clientX - transform.x,
          y: touch.clientY - transform.y,
        };
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY, dist: 0 };
        setIsPanning(true);
        return;
      }

      if (event.touches.length === 2) {
        const [touchOne, touchTwo] = [event.touches[0], event.touches[1]];
        lastTouchRef.current = {
          x: (touchOne.clientX + touchTwo.clientX) / 2,
          y: (touchOne.clientY + touchTwo.clientY) / 2,
          dist: Math.hypot(
            touchOne.clientX - touchTwo.clientX,
            touchOne.clientY - touchTwo.clientY
          ),
        };
      }
    },
    [transform.x, transform.y]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();

      if (event.touches.length === 1 && isPanning) {
        const touch = event.touches[0];
        setTransform((current) => ({
          ...current,
          x: touch.clientX - panStart.current.x,
          y: touch.clientY - panStart.current.y,
        }));
        return;
      }

      if (event.touches.length === 2 && lastTouchRef.current) {
        const [touchOne, touchTwo] = [event.touches[0], event.touches[1]];
        const distance = Math.hypot(
          touchOne.clientX - touchTwo.clientX,
          touchOne.clientY - touchTwo.clientY
        );
        const scaleDelta = distance / (lastTouchRef.current.dist || 1);

        setTransform((current) => ({
          ...current,
          scale: Math.max(0.45, Math.min(3, current.scale * scaleDelta)),
        }));

        lastTouchRef.current = {
          x: (touchOne.clientX + touchTwo.clientX) / 2,
          y: (touchOne.clientY + touchTwo.clientY) / 2,
          dist: distance,
        };
      }
    },
    [isPanning]
  );

  const handleTouchEnd = useCallback(
    (event: globalThis.TouchEvent) => {
      if (isPanning && lastTouchRef.current && event.changedTouches.length === 1) {
        const touch = event.changedTouches[0];
        const movedX = Math.abs(touch.clientX - lastTouchRef.current.x);
        const movedY = Math.abs(touch.clientY - lastTouchRef.current.y);

        if (movedX < 10 && movedY < 10) {
          const point = screenToMap(touch.clientX, touch.clientY);
          const room = findRoomAtPoint(point);

          if (room) {
            onRoomClick(room);
          } else {
            onMapClick();
          }
        }
      }

      setIsPanning(false);
      lastTouchRef.current = null;
    },
    [findRoomAtPoint, isPanning, onMapClick, onRoomClick, screenToMap]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (event: globalThis.TouchEvent) => handleTouchEnd(event);
    canvas.addEventListener("touchend", handler, { passive: false });
    return () => canvas.removeEventListener("touchend", handler);
  }, [handleTouchEnd]);

  useEffect(() => {
    if (!highlightedRoom || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const targetScale = 1.45;
    const roomCenterX = highlightedRoom.x + highlightedRoom.width / 2;
    const roomCenterY = highlightedRoom.y + highlightedRoom.height / 2;
    const newX =
      rect.width / 2 -
      roomCenterX * targetScale -
      (rect.width - GRID.width * targetScale) / 2;
    const newY =
      rect.height / 2 -
      roomCenterY * targetScale -
      (rect.height - GRID.height * targetScale) / 2;

    setTransform({ x: newX, y: newY, scale: targetScale });
  }, [highlightedRoom]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-grab overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.09),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_28%)] active:cursor-grabbing touch-none"
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
        className="h-full w-full"
      />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  radius: number
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(3, radius / 2.4), 0, Math.PI * 2);
  ctx.fill();
}

function getRoomColor(
  room: Room,
  getColor: (variable: string, fallback: string) => string
) {
  switch (room.type) {
    case "entrance":
      return `${getColor("--map-entrance", "#22c55e")}22`;
    case "elevator":
      return `${getColor("--map-elevator", "#64748b")}22`;
    case "stairs":
      return `${getColor("--map-stairs", "#d97706")}24`;
    case "restroom":
      return `${getColor("--map-restroom", "#0ea5e9")}22`;
    case "library":
      return `${getColor("--map-library", "#2563eb")}18`;
    case "cafeteria":
      return `${getColor("--map-cafeteria", "#f97316")}18`;
    case "lab":
      return `${getColor("--map-lab", "#0f766e")}18`;
    case "service":
      return `${getColor("--map-service", "#65a30d")}18`;
    case "office":
      return `${getColor("--map-office", "#64748b")}16`;
    default:
      return getColor("--map-room", "#f8fafc");
  }
}
