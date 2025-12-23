// components.tsx
// ✅ 목적: "JSX 있는 것" 전부 (UI/Feature 컴포넌트)

"use client";

import React, { useEffect, useRef } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import type { AvailabilityRange } from "./lib";
import { betweenISO, fmtKoreanMonthTitle, isSameMonth, normalizeRange, toISO } from "./lib";

// -----------------------------
// UI Small components
// -----------------------------
export function Pill({
  text,
  color,
  icon,
}: {
  text: string;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        fontWeight: 900,
        fontSize: 12,
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.14)",
        color: "white",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", color }}>{icon}</span>
      {text}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  icon,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "soft" | "danger";
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 14,
    fontWeight: 900,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(90deg, rgba(99,102,241,1), rgba(168,85,247,1))",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow: "0 12px 40px rgba(168,85,247,0.25)",
    },
    danger: {
      background: "linear-gradient(90deg, rgba(239,68,68,1), rgba(245,158,11,1))",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow: "0 12px 40px rgba(239,68,68,0.18)",
    },
    soft: {
      background: "rgba(255,255,255,0.10)",
    },
    ghost: {
      background: "transparent",
      border: "1px solid rgba(255,255,255,0.12)",
    },
  };

  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...(styles[variant] ?? {}) }}>
      {icon}
      {children}
    </button>
  );
}

/**
 * ✅ Modal scroll fix:
 * - 배경(body) 스크롤 잠금
 * - 모달 내부에 scroll 영역을 만들어 버튼(footer)이 항상 보이게
 * - 헤더에 내부 스크롤 up/down 버튼 제공
 */
export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const scrollBody = (delta: number) => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollBy({ top: delta, behavior: "smooth" });
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: "min(980px, 100%)",
          borderRadius: 22,
          overflow: "hidden",
          background: "rgba(14,14,20,0.98)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 90px rgba(0,0,0,0.65)",
          maxHeight: "min(92vh, 980px)",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Sparkles size={18} />
            <div
              style={{
                fontWeight: 1000,
                fontSize: 15,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="ghost" onClick={() => scrollBody(-260)} icon={<ChevronUp size={16} />}>
              위로
            </Button>
            <Button variant="ghost" onClick={() => scrollBody(260)} icon={<ChevronDown size={16} />}>
              아래로
            </Button>

            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                cursor: "pointer",
              }}
              title="Close"
            >
              <X size={18} style={{ margin: "0 auto" }} />
            </button>
          </div>
        </div>

        {/* Body (scrollable) */}
        <div ref={bodyRef} style={{ padding: 16, overflow: "auto", flex: 1, minHeight: 0 }}>
          {children}
          <div style={{ height: 10 }} />
        </div>

        {/* Footer (always visible) */}
        {footer ? (
          <div
            style={{
              padding: 16,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              background: "rgba(255,255,255,0.03)",
              flexWrap: "wrap",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// -----------------------------
// Shared Calendar Component
// -----------------------------
export function SharedCalendar({
  title,
  cursor,
  setCursor,
  monthDays,
  monthStart,
  eventsForDate,
  selections,
  draftDrag,
  onDayMouseDown,
  onDayMouseEnter,
  onClearSelections,
  interactive = true,
}: {
  title: string;
  cursor: Date;
  setCursor: (d: Date) => void;
  monthDays: Date[];
  monthStart: Date;
  eventsForDate: (d: Date) => { label: string; time?: string; color: string; kind: "event" | "weekly" }[];
  selections: AvailabilityRange[];
  draftDrag: { startISO: string; endISO: string } | null;
  onDayMouseDown: (iso: string) => void;
  onDayMouseEnter: (iso: string) => void;
  onClearSelections?: () => void;
  interactive?: boolean;
}) {
  const selectionContains = (dayISO: string) => {
    for (const r of selections) {
      if (betweenISO(dayISO, r.startDate, r.endDate)) return true;
    }
    if (draftDrag) {
      const nr = normalizeRange(draftDrag.startISO, draftDrag.endISO);
      if (betweenISO(dayISO, nr.start, nr.end)) return true;
    }
    return false;
  };

  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Calendar Header */}
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CalendarDays size={18} />
          <div style={{ fontWeight: 1000 }}>{title}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Button
            variant="soft"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            icon={<ChevronLeft size={16} />}
          >
            Prev
          </Button>
          <div style={{ fontWeight: 1000, minWidth: 92, textAlign: "center" }}>
            {fmtKoreanMonthTitle(cursor)}
          </div>
          <Button
            variant="soft"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            icon={<ChevronRight size={16} />}
          >
            Next
          </Button>

          {onClearSelections ? (
            <Button variant="ghost" onClick={onClearSelections} icon={<X size={16} />}>
              선택 초기화
            </Button>
          ) : null}
        </div>
      </div>

      {/* ✅ Weekday header + Day cells 를 한 번에 가로스크롤 */}
<div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
  <div style={{ minWidth: 840 }}>
    {/* Weekday header */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
        <div
          key={w}
          style={{
            padding: "10px 12px",
            fontSize: 12,
            fontWeight: 1000,
            opacity: 0.85,
            color: "rgba(255,255,255,0.9)",
            minWidth: 0,
          }}
        >
          {w}
        </div>
      ))}
    </div>

    {/* Day cells */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        gridAutoRows: 122,
      }}
    >
      {monthDays.map((d) => {
        const inMonth = isSameMonth(d, monthStart);
        const iso = toISO(d);
        const evs = eventsForDate(d);
        const selected = selectionContains(iso);

        return (
          <div
            key={iso}
            onMouseDown={() => (interactive ? onDayMouseDown(iso) : undefined)}
            onMouseEnter={() => (interactive ? onDayMouseEnter(iso) : undefined)}
            style={{
              borderRight: "1px solid rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              padding: 10,
              opacity: inMonth ? 1 : 0.4,
              position: "relative",
              cursor: interactive ? "crosshair" : "default",
              background: selected ? "rgba(99,102,241,0.18)" : "transparent",
              transition: "background 120ms ease",
              userSelect: "none",
              minWidth: 0, // ✅ 추가
            }}
            title={interactive ? "드래그로 범위를 선택할 수 있어요" : undefined}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 1000,
                opacity: 0.9,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              <span>{d.getDate()}</span>
              {selected ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 1000,
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  선택
                </span>
              ) : null}
            </div>

            {/* event bars */}
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {evs.slice(0, 3).map((e, idx) => (
                <div
                  key={`${iso}_${idx}_${e.label}`}
                  style={{
                    borderRadius: 10,
                    padding: "6px 8px",
                    fontSize: 12,
                    fontWeight: 1000,
                    background: e.color,
                    color: "white",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    minWidth: 0, // ✅ 추가
                  }}
                  title={e.kind === "weekly" ? "주간 반복 일정(예시)" : "기간 이벤트"}
                >
                  {/* ✅ 라벨이 길어도 칸을 밀지 않게 */}
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {e.label}
                  </span>

                  {e.time ? (
                    <span style={{ opacity: 0.9, whiteSpace: "nowrap" }}>{e.time}</span>
                  ) : null}
                </div>
              ))}
              {evs.length > 3 ? (
                <div style={{ fontSize: 12, opacity: 0.75 }}>+{evs.length - 3} more</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  </div>
</div>


      <div style={{ padding: 12, fontSize: 12, opacity: 0.85, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        팁) 날짜 선택은 <b>마우스를 누른 채 드래그</b>로 시작~종료 범위를 잡으면 됩니다.
      </div>
    </section>
  );
}

// -----------------------------
// Category Card UI
// -----------------------------
export function CategoryCard({
  title,
  desc,
  colorA,
  colorB,
  icon,
  onClick,
}: {
  title: string;
  desc: string;
  colorA: string;
  colorB: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.30)",
        padding: 16,
        cursor: "pointer",
        transition: "transform 120ms ease",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(0px)")}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 18,
          background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
          display: "grid",
          placeItems: "center",
          boxShadow: "0 14px 40px rgba(0,0,0,0.25)",
        }}
      >
        {icon}
      </div>

      <div style={{ marginTop: 12, fontSize: 16, fontWeight: 1100 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85, fontWeight: 850 }}>{desc}</div>

      <div
        style={{
          marginTop: 12,
          borderRadius: 14,
          padding: 10,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          fontSize: 12,
          opacity: 0.88,
          fontWeight: 900,
        }}
      >
        클릭 → 게시글 리스트(방 만들기) → 상세 → 신청하기 → 드래그 선택 → 전송
      </div>
    </div>
  );
}
