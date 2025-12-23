"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  LayoutGrid,
  List,
  Send,
  User,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  X,
  MapPin,
  Users,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/**
 * NODE — Recruit Community + Shared Calendar (Single TSX file demo)
 *
 * ✅ 포함된 기능(최종):
 * - "use client" 최상단 고정 (Server/Client 중복 방지)
 * - selectedPost 중복 정의 오류 해결: activePost로 통일
 * - 로그인(닉네임) → 내 캘린더 설정 화면 → 카테고리 화면
 * - 내 캘린더: 날짜(드래그) + 시간대(30분 단위 선택) + 제목 + 장소 → 중복 일정 허용
 * - 카테고리 화면 아래에 내 캘린더 크게 배치 + 모달로 수정
 * - 모집글 리스트/상세/신청하기(캘린더 드래그로 날짜 범위 여러개 선택)
 * - 방 만들기(날짜 드래그 + 시간대(30분 단위) + 장소 + 상세)
 * - 신청하기: 시간대(30분 단위) 선택
 *    -> 내 캘린더/내가 만든 방/내가 한 신청과 "날짜+시간" 겹치면
 *       1회 경고 + 신청 취소
 *       다시 전송 버튼 누르면 "중복 일정 신청"으로 허용
 * - 모달 스크롤: 배경 잠금 + 모달 내부 스크롤 + footer 버튼 항상 보임 + 위/아래 버튼
 */

// -----------------------------
// Types
// -----------------------------
type Category = "study" | "contest" | "project";

type WeeklySlot = {
  id: string;
  label: string;
  dayOfWeek: number; // 0=Sun..6=Sat
  time: string; // "18:30"
  color: string;
};

type RangeEvent = {
  id: string;
  label: string; // 캘린더 바에 표시할 텍스트
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string;

  // ✅ 추가: 시간대(선택형)
  startTime?: string; // "HH:MM"
  endTime?: string; // "HH:MM"
};

type RecruitPost = {
  id: string;
  category: Category;
  title: string;
  summary: string;
  body: string;
  ownerName: string; // 방장
  location: string;

  weeklySlots: WeeklySlot[]; // 팀 고정/권장 일정(예시)
  rangeEvents: RangeEvent[]; // 날짜 범위 이벤트(시간/장소 표시)
};

type AvailabilityRange = {
  id: string;
  startDate: string;
  endDate: string;
};

type Application = {
  id: string;
  postId: string;
  postTitle: string;
  applicant: string;
  ranges: AvailabilityRange[];
  startTime: string; // ✅ 신청 시간대
  endTime: string; // ✅ 신청 시간대
  duplicate?: boolean; // ✅ 중복 경고 후 재전송으로 승인된 경우
  createdAt: string; // readable
  note?: string;
};

// 내 캘린더(본인 일정) — 시간대 필수
type MyCalendarEvent = RangeEvent & {
  title: string;
  placeText: string;
  startTime: string;
  endTime: string;
};

// -----------------------------
// Dummy Data (초기값)
// -----------------------------
const INITIAL_POSTS: RecruitPost[] = [
  {
    id: "s1",
    category: "study",
    title: "React 초보 스터디 (주2회, 초보 환영)",
    summary: "캠퍼스에서 같이 React 기초부터 프로젝트까지! 일정은 공유 캘린더로 맞춰요.",
    body:
      "목표: React 기초 → 상태관리 → 간단 프로젝트\n" +
      "모집: 3~6명\n" +
      "진행: 주 2회(오프라인/온라인 혼합), 과제 가볍게\n" +
      "원하는 팀원: 꾸준히 할 사람, 질문/피드백 환영\n\n" +
      "신청 방법: 아래 공유 캘린더에서 가능한 날짜를 드래그로 선택 → 신청하기 전송!",
    ownerName: "민지",
    location: "캠퍼스 도서관",
    weeklySlots: [
      { id: "ws1", label: "스터디 후보", dayOfWeek: 2, time: "18:30", color: "#6366f1" },
      { id: "ws2", label: "스터디 후보", dayOfWeek: 6, time: "14:00", color: "#22c55e" },
    ],
    rangeEvents: [
      {
        id: "re1",
        label: "1주차 목표(기초)",
        startDate: addIsoDays(todayISO(), 0),
        endDate: addIsoDays(todayISO(), 6),
        color: "#f59e0b",
      },
    ],
  },
  {
    id: "c1",
    category: "contest",
    title: "공모전 팀원 모집 (기획/디자인/개발)",
    summary: "아이디어부터 프로토타입까지 빠르게! 일정 겹치는 구간부터 잡아요.",
    body:
      "목표: 공모전 출품(기획+프로토타입+발표)\n" +
      "모집: 기획 1 / 디자인 1 / 개발 1\n" +
      "진행: 2~3주 집중, 주 2~3회 미팅\n" +
      "원하는 팀원: 일정 공유 잘 되고 커뮤니케이션 빠른 사람\n\n" +
      "신청 방법: 아래 공유 캘린더에서 가능한 날짜 블록을 드래그로 선택 → 방장에게 보내기!",
    ownerName: "수아",
    location: "온라인",
    weeklySlots: [
      { id: "ws3", label: "미팅 후보", dayOfWeek: 3, time: "20:00", color: "#a855f7" },
      { id: "ws4", label: "미팅 후보", dayOfWeek: 5, time: "19:00", color: "#22c55e" },
    ],
    rangeEvents: [
      {
        id: "re2",
        label: "마감 주간",
        startDate: addIsoDays(todayISO(), 10),
        endDate: addIsoDays(todayISO(), 16),
        color: "#ef4444",
      },
    ],
  },
  {
    id: "p1",
    category: "project",
    title: "프로젝트 팀원 모집: Node(모집+공유캘린더) MVP",
    summary: "커뮤니티 글 + 모집방 공유 캘린더(핵심)로 일정 조율을 혁신합니다.",
    body:
      "목표: 커뮤니티(모집글) + 룸(멤버) + 공유 캘린더(가능 날짜 드래그) + 신청 전송\n" +
      "모집: 프론트/백엔드/기획\n" +
      "진행: 빠르게 MVP → 데모 → 피드백\n\n" +
      "신청: 공유 캘린더에 가능한 날짜를 드래그로 표시하고 방장에게 전송해주세요.",
    ownerName: "준호",
    location: "캠퍼스 카페",
    weeklySlots: [
      { id: "ws5", label: "개발 후보", dayOfWeek: 1, time: "21:00", color: "#0ea5e9" },
      { id: "ws6", label: "개발 후보", dayOfWeek: 4, time: "20:00", color: "#f59e0b" },
    ],
    rangeEvents: [
      {
        id: "re3",
        label: "MVP 스프린트",
        startDate: addIsoDays(todayISO(), 2),
        endDate: addIsoDays(todayISO(), 12),
        color: "#22c55e",
      },
    ],
  },
];

// -----------------------------
// Date Utils
// -----------------------------
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clampNoon(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return clampNoon(new Date(y, (m || 1) - 1, d || 1));
}

function todayISO() {
  return toISO(new Date());
}

function addIsoDays(iso: string, days: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function betweenISO(dayISO: string, startISO: string, endISO: string) {
  const day = parseISO(dayISO).getTime();
  const s = parseISO(startISO).getTime();
  const e = parseISO(endISO).getTime();
  return day >= s && day <= e;
}

function normalizeRange(aISO: string, bISO: string) {
  const a = parseISO(aISO).getTime();
  const b = parseISO(bISO).getTime();
  if (a <= b) return { start: aISO, end: bISO };
  return { start: bISO, end: aISO };
}

function fmtKoreanMonthTitle(cursor: Date) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth() + 1;
  return `${y}.${String(m).padStart(2, "0")}`;
}

function nowLabel() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function pickEventColor() {
  const colors = ["#6366f1", "#22c55e", "#f59e0b", "#a855f7", "#0ea5e9", "#ef4444", "#ec4899"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// -----------------------------
// Time Utils (30-min slots)
// -----------------------------
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let m = 0; m <= 24 * 60; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    out.push(`${hh}:${mm}`);
  }
  return out; // includes 24:00
})();

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function isValidTimeRange(start: string, end: string) {
  return timeToMin(end) > timeToMin(start);
}

function timeOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const as = timeToMin(aStart);
  const ae = timeToMin(aEnd);
  const bs = timeToMin(bStart);
  const be = timeToMin(bEnd);
  return as < be && bs < ae;
}

function dateOverlap(aStartISO: string, aEndISO: string, bStartISO: string, bEndISO: string) {
  const as = parseISO(aStartISO).getTime();
  const ae = parseISO(aEndISO).getTime();
  const bs = parseISO(bStartISO).getTime();
  const be = parseISO(bEndISO).getTime();
  return Math.max(as, bs) <= Math.min(ae, be);
}

// -----------------------------
// UI Small components (no Tailwind required)
// -----------------------------
function Pill({ text, color, icon }: { text: string; color: string; icon?: React.ReactNode }) {
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

function Button({
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
 * - 헤더에 내부 스크롤 up/down 버튼 제공(원하면 눌러서 모달 내부만 스크롤)
 */
function Modal({
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
            <div style={{ fontWeight: 1000, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

        <div ref={bodyRef} style={{ padding: 16, overflow: "auto", flex: 1, minHeight: 0 }}>
          {children}
          <div style={{ height: 10 }} />
        </div>

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
// Time Range Picker (30-min slots)
// -----------------------------
function TimeRangePicker({
  label,
  start,
  end,
  onChangeStart,
  onChangeEnd,
  inputStyle,
}: {
  label: string;
  start: string;
  end: string;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  inputStyle: React.CSSProperties;
}) {
  const endOptions = TIME_OPTIONS.filter((t) => timeToMin(t) > timeToMin(start));
  const startOptions = TIME_OPTIONS.filter((t) => t !== "24:00"); // start는 24:00 제외

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 1000 }}>{label}</div>
      {(() => {
        // ensure option text is visible on light popup backgrounds by overriding the text color
        const selectStyle: React.CSSProperties = { ...inputStyle, color: "#0f172a" };
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <select style={selectStyle} value={start} onChange={(e) => onChangeStart(e.target.value)}>
              {startOptions.map((t) => (
                <option key={t} value={t} style={{ color: "#0f172a" }}>
                  {t}
                </option>
              ))}
            </select>

            <select style={selectStyle} value={end} onChange={(e) => onChangeEnd(e.target.value)}>
              {endOptions.map((t) => (
                <option key={t} value={t} style={{ color: "#0f172a" }}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        );
      })()}
      {!isValidTimeRange(start, end) ? (
        <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900, color: "#f59e0b" }}>
          끝 시간이 시작 시간보다 뒤여야 합니다.
        </div>
      ) : null}
    </div>
  );
}

// -----------------------------
// Shared Calendar Component
// -----------------------------
function SharedCalendar({
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
          <Button variant="soft" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} icon={<ChevronLeft size={16} />}>
            Prev
          </Button>
          <div style={{ fontWeight: 1000, minWidth: 92, textAlign: "center" }}>{fmtKoreanMonthTitle(cursor)}</div>
          <Button variant="soft" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} icon={<ChevronRight size={16} />}>
            Next
          </Button>

          {onClearSelections ? (
            <Button variant="ghost" onClick={onClearSelections} icon={<X size={16} />}>
              선택 초기화
            </Button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
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
            }}
          >
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: 122 }}>
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
                    }}
                    title={e.kind === "weekly" ? "주간 반복 일정(예시)" : "기간 이벤트/내 일정"}
                  >
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.label}</span>
                    {e.time ? <span style={{ opacity: 0.9 }}>{e.time}</span> : null}
                  </div>
                ))}
                {evs.length > 3 ? <div style={{ fontSize: 12, opacity: 0.75 }}>+{evs.length - 3} more</div> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 12, fontSize: 12, opacity: 0.85, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        팁) 날짜 선택은 <b>마우스를 누른 채 드래그</b>로 시작~종료 범위를 잡으면 됩니다.
      </div>
    </section>
  );
}

// -----------------------------
// Main Page
// -----------------------------
export default function Home() {
  // posts
  const [posts, setPosts] = useState<RecruitPost[]>(() => INITIAL_POSTS);

  // auth
  const [loggedIn, setLoggedIn] = useState(false);
  const [nameInput, setNameInput] = useState("동호");
  const [userName, setUserName] = useState("동호");

  // view
  type View = "login" | "myCalendarSetup" | "category" | "list" | "detail";
  const [view, setView] = useState<View>("login");

  // category / selected post
  const [category, setCategory] = useState<Category>("study");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // list ui
  const [search, setSearch] = useState("");

  // -----------------------------
  // ✅ 내 캘린더 (본인 일정)
  // -----------------------------
  const [myCalendarEvents, setMyCalendarEvents] = useState<MyCalendarEvent[]>([]);
  const [myCursor, setMyCursor] = useState<Date>(() => new Date());

  const myMonthStart = useMemo(() => startOfMonth(myCursor), [myCursor]);
  const myMonthDays = useMemo(() => {
    const start = new Date(myMonthStart);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) days.push(addDays(start, i));
    return days;
  }, [myMonthStart]);

  // 내 캘린더 드래그 범위
  const [myDragging, setMyDragging] = useState(false);
  const [myDragStartISO, setMyDragStartISO] = useState<string | null>(null);
  const [myDragEndISO, setMyDragEndISO] = useState<string | null>(null);
  const [myStartISO, setMyStartISO] = useState<string | null>(null);
  const [myEndISO, setMyEndISO] = useState<string | null>(null);

  // 내 캘린더 입력
  const [myTitle, setMyTitle] = useState("");
  const [myPlaceText, setMyPlaceText] = useState("");
  const [myStartTime, setMyStartTime] = useState("09:00");
  const [myEndTime, setMyEndTime] = useState("09:30");

  // 내 캘린더 수정 모달
  const [myEditOpen, setMyEditOpen] = useState(false);

  // highlight persistent selection for my calendar setup/draft. When user finalizes a drag,
  // we store myStartISO/myEndISO. Use this in SharedCalendar selections to keep
  // previously selected range highlighted even when starting a new drag.
  const mySelections = useMemo(() => {
    if (myStartISO && myEndISO) return [{ id: "myPersist", startDate: myStartISO, endDate: myEndISO }];
    return [];
  }, [myStartISO, myEndISO]);

  const myDraft = useMemo(() => {
    if (myDragging && myDragStartISO && myDragEndISO) return { startISO: myDragStartISO, endISO: myDragEndISO };
    if (myStartISO && myEndISO) return { startISO: myStartISO, endISO: myEndISO };
    return null;
  }, [myDragging, myDragStartISO, myDragEndISO, myStartISO, myEndISO]);

  const resetMyDraft = () => {
    setMyDragging(false);
    setMyDragStartISO(null);
    setMyDragEndISO(null);
    setMyStartISO(null);
    setMyEndISO(null);
  };

  const resetMyForm = () => {
    setMyTitle("");
    setMyPlaceText("");
  };

  const startMyDrag = (iso: string) => {
    setMyDragging(true);
    setMyDragStartISO(iso);
    setMyDragEndISO(iso);
  };

  const extendMyDrag = (iso: string) => {
    if (!myDragging) return;
    setMyDragEndISO(iso);
  };

  const finalizeMyDrag = () => {
    if (!myDragging || !myDragStartISO || !myDragEndISO) {
      setMyDragging(false);
      setMyDragStartISO(null);
      setMyDragEndISO(null);
      return;
    }
    const nr = normalizeRange(myDragStartISO, myDragEndISO);
    setMyStartISO(nr.start);
    setMyEndISO(nr.end);
    setMyDragging(false);
    setMyDragStartISO(null);
    setMyDragEndISO(null);
  };

  useEffect(() => {
    const enabled = view === "myCalendarSetup" || myEditOpen;
    if (!enabled) return;
    const onUp = () => finalizeMyDrag();
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, myEditOpen, myDragging, myDragStartISO, myDragEndISO]);

  const canAddMyEvent = useMemo(() => {
    return (
      myTitle.trim().length > 0 &&
      myPlaceText.trim().length > 0 &&
      !!myStartISO &&
      !!myEndISO &&
      isValidTimeRange(myStartTime, myEndTime)
    );
  }, [myTitle, myPlaceText, myStartISO, myEndISO, myStartTime, myEndTime]);

  const addMyEvent = () => {
    if (!canAddMyEvent) return;
    const start = myStartISO!;
    const end = myEndISO!;
    const color = pickEventColor();
    const title = myTitle.trim();
    const placeText = myPlaceText.trim();

    const newEv: MyCalendarEvent = {
      id: uid("my"),
      title,
      placeText,
      startTime: myStartTime,
      endTime: myEndTime,
      label: `${title} / ${myStartTime}~${myEndTime} · ${placeText}`,
      startDate: start,
      endDate: end,
      color,
    };

    // ✅ 중복 허용
    setMyCalendarEvents((prev) => [newEv, ...prev]);

    resetMyDraft();
    resetMyForm();
  };

  const deleteMyEvent = (id: string) => {
    setMyCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const myEventsForDate = (d: Date) => {
    const iso = toISO(d);
    return myCalendarEvents
      .filter((e) => betweenISO(iso, e.startDate, e.endDate))
      .map((e) => ({
        label: e.label,
        color: e.color,
        kind: "event" as const,
      }));
  };

  // -----------------------------
  // 모집방 상세 캘린더 커서
  // -----------------------------
  const [cursor, setCursor] = useState(() => new Date());

  // 신청 드래그 선택 state
  const [dragging, setDragging] = useState(false);
  const [dragStartISO, setDragStartISO] = useState<string | null>(null);
  const [dragEndISO, setDragEndISO] = useState<string | null>(null);

  // 신청자 선택 범위 저장(post별 여러 구간)
  const [mySelectionsByPost, setMySelectionsByPost] = useState<Record<string, AvailabilityRange[]>>({});

  // 신청 데이터(inbox)
  const [applications, setApplications] = useState<Application[]>([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyNote, setApplyNote] = useState("");

  // ✅ 신청 시간대 + 중복 허용 플래그
  const [applyStartTime, setApplyStartTime] = useState("19:00");
  const [applyEndTime, setApplyEndTime] = useState("19:30");
  const [allowDuplicateApply, setAllowDuplicateApply] = useState(false);

  // ✅ selectedPost 중복 오류 해결: activePost로 단일화
  const activePost = useMemo(() => posts.find((p) => p.id === selectedPostId) ?? null, [posts, selectedPostId]);

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const monthDays = useMemo(() => {
    const start = new Date(monthStart);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) days.push(addDays(start, i));
    return days;
  }, [monthStart]);

  const postsInCategory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts
      .filter((p) => p.category === category)
      .filter((p) => {
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.ownerName.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
        );
      });
  }, [category, search, posts]);

  const currentSelections = useMemo(() => {
    if (!activePost) return [];
    return mySelectionsByPost[activePost.id] ?? [];
  }, [mySelectionsByPost, activePost]);

  const draftDrag = useMemo(() => {
    if (!dragStartISO || !dragEndISO) return null;
    return { startISO: dragStartISO, endISO: dragEndISO };
  }, [dragStartISO, dragEndISO]);

  const eventsForDate = (post: RecruitPost, d: Date) => {
    const iso = toISO(d);
    const dow = d.getDay();

    const weekly = post.weeklySlots
      .filter((s) => s.dayOfWeek === dow)
      .map((s) => ({
        label: s.label,
        time: s.time,
        color: s.color,
        kind: "weekly" as const,
      }))
      .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

    const ranges = post.rangeEvents
      .filter((r) => betweenISO(iso, r.startDate, r.endDate))
      .map((r) => ({
        label: r.label,
        color: r.color,
        kind: "event" as const,
      }));

    return [...ranges, ...weekly];
  };

  // 신청 드래그 handlers
  const startDrag = (iso: string) => {
    if (!applyOpen) return;
    setDragging(true);
    setDragStartISO(iso);
    setDragEndISO(iso);
  };

  const extendDrag = (iso: string) => {
    if (!applyOpen) return;
    if (!dragging) return;
    setDragEndISO(iso);
  };

  const finalizeDrag = () => {
    if (!applyOpen) return;
    if (!dragging || !activePost || !dragStartISO || !dragEndISO) {
      setDragging(false);
      setDragStartISO(null);
      setDragEndISO(null);
      return;
    }

    const nr = normalizeRange(dragStartISO, dragEndISO);
    const newRange: AvailabilityRange = { id: uid("range"), startDate: nr.start, endDate: nr.end };

    setMySelectionsByPost((prev) => {
      const old = prev[activePost.id] ?? [];
      return { ...prev, [activePost.id]: [newRange, ...old] };
    });

    setDragging(false);
    setDragStartISO(null);
    setDragEndISO(null);
  };

  useEffect(() => {
    const onUp = () => finalizeDrag();
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, dragStartISO, dragEndISO, applyOpen, selectedPostId]);

  // -----------------------------
  // login flow
  // -----------------------------
  const doLogin = () => {
    const n = nameInput.trim();
    if (!n) return;
    setLoggedIn(true);
    setUserName(n);

    // 로그인 직후: 내 캘린더 설정 화면으로 이동
    setView("myCalendarSetup");
    setMyCursor(new Date());
  };

  const doLogout = () => {
    setLoggedIn(false);
    setView("login");
    setSelectedPostId(null);
    setApplyOpen(false);
    setSearch("");

    setMyCalendarEvents([]);
    resetMyDraft();
    resetMyForm();
    setMyEditOpen(false);

    // 신청 관련도 초기화
    setApplications([]);
    setMySelectionsByPost({});
    setAllowDuplicateApply(false);
  };

  const goCategory = () => setView("category");

  const openCategory = (c: Category) => {
    setCategory(c);
    setView("list");
  };

  const openPost = (id: string) => {
    setSelectedPostId(id);
    setView("detail");
    setCursor(new Date());
    setApplyOpen(false);
  };

  // apply flow
  const openApply = () => {
    if (!activePost) return;
    setApplyOpen(true);
    setApplyNote("");
    setAllowDuplicateApply(false);
    setApplyStartTime("19:00");
    setApplyEndTime("19:30");
  };

  const clearMySelections = () => {
    if (!activePost) return;
    setMySelectionsByPost((prev) => ({ ...prev, [activePost.id]: [] }));
    setAllowDuplicateApply(false);
  };

  // 시간/선택이 바뀌면 "2번째 클릭 허용" 리셋
  useEffect(() => {
    if (!applyOpen) return;
    setAllowDuplicateApply(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyOpen, applyStartTime, applyEndTime, currentSelections.length]);

  // ✅ 충돌 검사
  const findConflictsForApply = (candidate: AvailabilityRange[], startTime: string, endTime: string) => {
    const conflicts: string[] = [];

    // 1) 내 캘린더 일정
    for (const cr of candidate) {
      for (const ev of myCalendarEvents) {
        if (
          dateOverlap(cr.startDate, cr.endDate, ev.startDate, ev.endDate) &&
          timeOverlap(startTime, endTime, ev.startTime, ev.endTime)
        ) {
          conflicts.push(`내 캘린더: ${ev.title} (${ev.startDate}~${ev.endDate} / ${ev.startTime}~${ev.endTime})`);
        }
      }
    }

    // 2) 내가 만든 방(방장인 posts)의 일정(rangeEvents에 시간 포함된 것만)
    const myRooms = posts.filter((p) => p.ownerName === userName);
    for (const cr of candidate) {
      for (const p of myRooms) {
        for (const re of p.rangeEvents) {
          if (!re.startTime || !re.endTime) continue;
          if (
            dateOverlap(cr.startDate, cr.endDate, re.startDate, re.endDate) &&
            timeOverlap(startTime, endTime, re.startTime, re.endTime)
          ) {
            conflicts.push(`내가 만든 방: ${p.title} (${re.startDate}~${re.endDate} / ${re.startTime}~${re.endTime})`);
          }
        }
      }
    }

    // 3) 내가 이미 넣은 신청(내 신청들)
    const myApps = applications.filter((a) => a.applicant === userName);
    for (const cr of candidate) {
      for (const a of myApps) {
        for (const r of a.ranges) {
          if (
            dateOverlap(cr.startDate, cr.endDate, r.startDate, r.endDate) &&
            timeOverlap(startTime, endTime, a.startTime, a.endTime)
          ) {
            conflicts.push(`내 신청: ${a.postTitle} (${r.startDate}~${r.endDate} / ${a.startTime}~${a.endTime})`);
          }
        }
      }
    }

    return Array.from(new Set(conflicts));
  };

  const sendToOwner = () => {
    if (!activePost) return;

    const ranges = mySelectionsByPost[activePost.id] ?? [];
    if (ranges.length === 0) return;

    if (!isValidTimeRange(applyStartTime, applyEndTime)) {
      alert("시간대를 올바르게 선택해주세요. (끝 시간이 시작 시간보다 뒤여야 합니다)");
      return;
    }

    const conflicts = findConflictsForApply(ranges, applyStartTime, applyEndTime);

    // ✅ 1회차: 경고 + 취소
    if (conflicts.length > 0 && !allowDuplicateApply) {
      alert(
        `⚠️ 시간대가 겹쳐서 신청이 취소되었습니다.\n\n겹치는 일정:\n- ${conflicts.join("\n- ")}\n\n다시 “방장에게 전송”을 누르면 중복일정으로 신청됩니다.`
      );
      setAllowDuplicateApply(true);
      return;
    }

    // ✅ 2회차(또는 충돌 없음): 신청 진행
    const app: Application = {
      id: uid("app"),
      postId: activePost.id,
      postTitle: activePost.title,
      applicant: userName,
      ranges,
      startTime: applyStartTime,
      endTime: applyEndTime,
      duplicate: conflicts.length > 0,
      createdAt: nowLabel(),
      note: (conflicts.length > 0 ? "[중복일정 신청]\n" : "") + (applyNote.trim() || ""),
    };

    setApplications((prev) => [app, ...prev]);
    setAllowDuplicateApply(false);
    setApplyOpen(false);

    alert(conflicts.length > 0 ? "중복 일정으로 신청되었습니다!" : "방장에게 가능한 날짜가 전송되었습니다!");
  };

  const inboxForActivePost = useMemo(() => {
    if (!activePost) return [];
    return applications.filter((a) => a.postId === activePost.id);
  }, [applications, activePost]);

  const isOwner = useMemo(() => {
    if (!activePost) return false;
    return activePost.ownerName === userName;
  }, [activePost, userName]);

  // -----------------------------
  // ✅ 방 만들기(Create Room)
  // -----------------------------
  const [createOpen, setCreateOpen] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cPlace, setCPlace] = useState("");
  const [cField, setCField] = useState("");
  const [cDetail, setCDetail] = useState("");
  const [cStartTime, setCStartTime] = useState("19:00");
  const [cEndTime, setCEndTime] = useState("19:30");

  const [createCursor, setCreateCursor] = useState<Date>(() => new Date());
  const cMonthStart = useMemo(() => startOfMonth(createCursor), [createCursor]);
  const cMonthDays = useMemo(() => {
    const start = new Date(cMonthStart);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) days.push(addDays(start, i));
    return days;
  }, [cMonthStart]);

  const [cDragging, setCDragging] = useState(false);
  const [cDragStartISO, setCDragStartISO] = useState<string | null>(null);
  const [cDragEndISO, setCDragEndISO] = useState<string | null>(null);
  const [cStartISO, setCStartISO] = useState<string | null>(null);
  const [cEndISO, setCEndISO] = useState<string | null>(null);

  const createDraft = useMemo(() => {
    if (cDragging && cDragStartISO && cDragEndISO) return { startISO: cDragStartISO, endISO: cDragEndISO };
    if (cStartISO && cEndISO) return { startISO: cStartISO, endISO: cEndISO };
    return null;
  }, [cDragging, cDragStartISO, cDragEndISO, cStartISO, cEndISO]);

  // persistent selection for create room: highlight the previously finalized date range
  const createSelections = useMemo(() => {
    if (cStartISO && cEndISO) return [{ id: "createPersist", startDate: cStartISO, endDate: cEndISO }];
    return [];
  }, [cStartISO, cEndISO]);

  const openCreateRoom = () => {
    setCreateOpen(true);
    setCTitle("");
    setCPlace("");
    setCField("");
    setCDetail("");
    setCStartTime("19:00");
    setCEndTime("19:30");
    setCreateCursor(new Date());
    setCDragging(false);
    setCDragStartISO(null);
    setCDragEndISO(null);
    setCStartISO(null);
    setCEndISO(null);
  };

  const closeCreateRoom = () => {
    setCreateOpen(false);
    setCDragging(false);
    setCDragStartISO(null);
    setCDragEndISO(null);
  };

  const cStartDrag = (iso: string) => {
    setCDragging(true);
    setCDragStartISO(iso);
    setCDragEndISO(iso);
  };

  const cExtendDrag = (iso: string) => {
    if (!cDragging) return;
    setCDragEndISO(iso);
  };

  const cFinalizeDrag = () => {
    if (!createOpen) return;
    if (!cDragging || !cDragStartISO || !cDragEndISO) {
      setCDragging(false);
      setCDragStartISO(null);
      setCDragEndISO(null);
      return;
    }
    const nr = normalizeRange(cDragStartISO, cDragEndISO);
    setCStartISO(nr.start);
    setCEndISO(nr.end);
    setCDragging(false);
    setCDragStartISO(null);
    setCDragEndISO(null);
  };

  useEffect(() => {
    if (!createOpen) return;
    const onUp = () => cFinalizeDrag();
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, cDragging, cDragStartISO, cDragEndISO]);

  const clearCreateDates = () => {
    setCDragging(false);
    setCDragStartISO(null);
    setCDragEndISO(null);
    setCStartISO(null);
    setCEndISO(null);
  };

  const createPreviewEventsForDate = (d: Date) => {
    const iso = toISO(d);
    const out: { label: string; time?: string; color: string; kind: "event" | "weekly" }[] = [];

    const start = cStartISO ?? (cDragging ? cDragStartISO : null);
    const end = cEndISO ?? (cDragging ? cDragEndISO : null);

    if (start && end) {
      const nr = normalizeRange(start, end);
      if (betweenISO(iso, nr.start, nr.end)) {
        const timeText = `${cStartTime}~${cEndTime}`;
        const placeText = cPlace.trim() || "장소(입력)";
        out.push({
          label: `${timeText} · ${placeText}`,
          color: "rgba(99,102,241,1)",
          kind: "event",
        });
      }
    }
    return out;
  };

  const canCreate = useMemo(() => {
    return (
      cTitle.trim().length > 0 &&
      cField.trim().length > 0 &&
      cDetail.trim().length > 0 &&
      cPlace.trim().length > 0 &&
      !!cStartISO &&
      !!cEndISO &&
      isValidTimeRange(cStartTime, cEndTime)
    );
  }, [cTitle, cField, cDetail, cPlace, cStartISO, cEndISO, cStartTime, cEndTime]);

  const createRoom = () => {
    if (!canCreate) return;
    const start = cStartISO!;
    const end = cEndISO!;
    const color = pickEventColor();
    const timeText = `${cStartTime}~${cEndTime}`;

    const newPost: RecruitPost = {
      id: uid("post"),
      category,
      title: cTitle.trim(),
      summary: `${cField.trim()} · ${timeText} · ${cPlace.trim()}`,
      body:
        `1. 제목: ${cTitle.trim()}\n` +
        `2. 날짜/시간/장소: ${start} ~ ${end} / ${timeText} / ${cPlace.trim()}\n` +
        `3. 모집분야: ${cField.trim()}\n` +
        `4. 상세설명:\n${cDetail.trim()}\n`,
      ownerName: userName,
      location: cPlace.trim(),
      weeklySlots: [],
      rangeEvents: [
        {
          id: uid("re"),
          label: `${timeText} · ${cPlace.trim()}`,
          startDate: start,
          endDate: end,
          color,
          startTime: cStartTime,
          endTime: cEndTime,
        },
      ],
    };

    setPosts((prev) => [newPost, ...prev]);
    setCreateOpen(false);
    alert("방이 생성되었습니다! (리스트 상단에 추가됨)");
  };

  // -----------------------------
  // Styles
  // -----------------------------
  const pageBg: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 10% 10%, rgba(99,102,241,0.35), transparent 60%)," +
      "radial-gradient(900px 500px at 90% 20%, rgba(168,85,247,0.28), transparent 55%)," +
      "radial-gradient(900px 500px at 30% 90%, rgba(34,197,94,0.18), transparent 55%)," +
      "linear-gradient(180deg, rgba(10,10,16,1), rgba(9,9,14,1))",
    color: "white",
  };

  const shell: React.CSSProperties = {
    // Stretch the main container to full width instead of centering it.
    maxWidth: "100%",
    width: "100%",
    margin: 0,
    padding: 18,
  };

  const topbar: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
    flexWrap: "wrap",
  };

  const card: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.3)",
  };

  const input: React.CSSProperties = {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    padding: "12px 12px",
    outline: "none",
    fontWeight: 800,
  };

  const labelSmall: React.CSSProperties = { fontSize: 14, opacity: 0.82, fontWeight: 1000 };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={pageBg}>
      <div style={shell}>
        {/* Top Bar */}
        <div style={topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 16,
                background: "linear-gradient(135deg, rgba(99,102,241,1), rgba(168,85,247,1))",
                boxShadow: "0 14px 40px rgba(168,85,247,0.25)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <LayoutGrid size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 1100, letterSpacing: 0.2 }}>Node</div>
              <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 900 }}>
                (최종) 시간대 선택 + 겹치면 1회 경고 후 취소 → 재전송 시 중복 신청
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {loggedIn ? (
              <>
                <Pill text={userName} color="#60a5fa" icon={<User size={14} />} />
                <Button variant="ghost" onClick={doLogout} icon={<LogOut size={16} />}>
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={doLogin} icon={<LogIn size={16} />}>
                Login
              </Button>
            )}
          </div>
        </div>

        <div style={{ height: 14 }} />

        {/* View: login */}
        {view === "login" ? (
          <div style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 20, fontWeight: 1100, marginBottom: 6 }}>로그인</div>
            <div style={{ fontSize: 13, opacity: 0.82, fontWeight: 800, marginBottom: 14 }}>
              (데모) 닉네임만 입력하고 로그인합니다.
            </div>

            <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
              <div style={labelSmall}>닉네임</div>
              <input
                style={input}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="예: 동호"
                onKeyDown={(e) => {
                  if (e.key === "Enter") doLogin();
                }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <Button variant="primary" onClick={doLogin} icon={<LogIn size={16} />}>
                  로그인
                </Button>
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontSize: 12,
                  opacity: 0.92,
                  fontWeight: 900,
                  lineHeight: 1.55,
                }}
              >
                이번 흐름:
                <div style={{ marginTop: 8, fontWeight: 900 }}>
                  1) 로그인 → 2) 내 캘린더 설정(중복 일정 OK, 시간대 선택) → 3) 카테고리 선택(아래 내 캘린더 표시)
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* View: myCalendarSetup */}
        {view === "myCalendarSetup" ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ ...card, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 1100, marginBottom: 6 }}>내 캘린더 설정</div>
                  <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 850, lineHeight: 1.55 }}>
                    여러 일정을 <b>중복</b>으로 계속 추가할 수 있어요(겹쳐도 OK).<br />
                    일정은 <b>날짜(드래그 선택)</b> + <b>시간대(30분 단위 선택)</b> + <b>제목/장소</b>로 등록됩니다.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      goCategory();
                    }}
                    icon={<ArrowLeft size={16} />}
                  >
                    건너뛰고 카테고리로
                  </Button>
                  <Button variant="primary" onClick={goCategory} icon={<CheckCircle2 size={16} />}>
                    완료하고 카테고리로
                  </Button>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
              {/* left: form + list */}
              <div style={{ ...card, padding: 16, display: "grid", gap: 12 }}>
                <div style={{ fontWeight: 1100, fontSize: 15 }}>일정 추가</div>

                <div>
                  <div style={labelSmall}>제목</div>
                  <input style={input} value={myTitle} onChange={(e) => setMyTitle(e.target.value)} placeholder="예) 수업 / 알바 / 회의 / 스터디" />
                </div>

                <TimeRangePicker
                  label="시간대(30분 단위)"
                  start={myStartTime}
                  end={myEndTime}
                  onChangeStart={(v) => {
                    setMyStartTime(v);
                    if (!isValidTimeRange(v, myEndTime)) {
                      const next = TIME_OPTIONS.find((t) => timeToMin(t) > timeToMin(v)) ?? "09:30";
                      setMyEndTime(next);
                    }
                  }}
                  onChangeEnd={setMyEndTime}
                  inputStyle={input}
                />

                <div>
                  <div style={labelSmall}>장소</div>
                  <input style={input} value={myPlaceText} onChange={(e) => setMyPlaceText(e.target.value)} placeholder="예) 도서관 / 온라인 / 회사" />
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Pill text={`사용자: ${userName}`} color="#60a5fa" icon={<User size={14} />} />
                  <Pill
                    text={myStartISO && myEndISO ? `${myStartISO} ~ ${myEndISO}` : "날짜 범위 선택 필요"}
                    color="#f59e0b"
                    icon={<CalendarDays size={14} />}
                  />
                  <Pill text={`${myStartTime}~${myEndTime}`} color="#a855f7" icon={<Clock size={14} />} />
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="soft" onClick={resetMyDraft} icon={<X size={16} />}>
                    날짜 선택 초기화
                  </Button>
                  <Button variant="primary" onClick={addMyEvent} icon={<Plus size={16} />} disabled={!canAddMyEvent}>
                    일정 추가
                  </Button>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 12 }}>
                  <div style={{ fontWeight: 1100, marginBottom: 8 }}>내 일정 목록 (겹쳐도 OK)</div>
                  {myCalendarEvents.length === 0 ? (
                    <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 850 }}>
                      아직 일정이 없어요. 오른쪽 캘린더에서 날짜를 드래그로 선택하고 추가해보세요.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {myCalendarEvents.slice(0, 12).map((e) => (
                        <div
                          key={e.id}
                          style={{
                            padding: 12,
                            borderRadius: 16,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <span style={{ width: 10, height: 10, borderRadius: 999, background: e.color }} />
                              <div style={{ fontWeight: 1100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {e.title}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900, marginTop: 6 }}>
                              {e.startDate} ~ {e.endDate} / {e.startTime}~{e.endTime} · {e.placeText}
                            </div>
                          </div>
                          <Button variant="ghost" onClick={() => deleteMyEvent(e.id)} icon={<X size={16} />}>
                            삭제
                          </Button>
                        </div>
                      ))}
                      {myCalendarEvents.length > 12 ? (
                        <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>+ {myCalendarEvents.length - 12} more</div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* right: calendar */}
              <div style={{ display: "grid", gap: 12 }}>
                <SharedCalendar
                  title="내 캘린더 (날짜 범위 드래그 선택)"
                  cursor={myCursor}
                  setCursor={setMyCursor}
                  monthDays={myMonthDays}
                  monthStart={myMonthStart}
                  eventsForDate={(d) => myEventsForDate(d)}
                  selections={mySelections}
                  draftDrag={myDraft}
                  onDayMouseDown={startMyDrag}
                  onDayMouseEnter={extendMyDrag}
                  onClearSelections={resetMyDraft}
                  interactive={true}
                />

                <div style={{ ...card, padding: 14 }}>
                  <div style={{ fontWeight: 1100, marginBottom: 8 }}>설명</div>
                  <div style={{ fontSize: 13, opacity: 0.88, fontWeight: 900, lineHeight: 1.55 }}>
                    - 날짜는 오른쪽 캘린더에서 <b>드래그</b>로 선택합니다.<br />
                    - 시간은 <b>30분 단위 선택</b>입니다.<br />
                    - 일정은 서로 <b>겹쳐도</b> 그대로 표시됩니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* View: category */}
        {view === "category" ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ ...card, padding: 18 }}>
              <div style={{ fontSize: 20, fontWeight: 1100, marginBottom: 6 }}>처음 화면</div>
              <div style={{ fontSize: 13, opacity: 0.82, fontWeight: 800 }}>스터디 모집 / 공모전 팀원 모집 / 프로젝트 모집 중 하나를 선택하세요.</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              <CategoryCard
                title="스터디 모집"
                desc="같이 공부할 사람 찾기"
                colorA="rgba(99,102,241,1)"
                colorB="rgba(14,165,233,1)"
                icon={<List size={20} />}
                onClick={() => openCategory("study")}
              />
              <CategoryCard
                title="공모전 팀원 모집"
                desc="아이디어부터 제출까지"
                colorA="rgba(168,85,247,1)"
                colorB="rgba(236,72,153,1)"
                icon={<Sparkles size={20} />}
                onClick={() => openCategory("contest")}
              />
              <CategoryCard
                title="프로젝트 모집"
                desc="MVP/포트폴리오/협업"
                colorA="rgba(34,197,94,1)"
                colorB="rgba(245,158,11,1)"
                icon={<LayoutGrid size={20} />}
                onClick={() => openCategory("project")}
              />
            </div>

            <div style={{ ...card, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 1100, marginBottom: 6 }}>내 캘린더</div>
                  <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 850 }}>로그인 후 설정한 내 일정이 여기 표시됩니다. (겹쳐도 OK)</div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="ghost" onClick={() => setView("myCalendarSetup")} icon={<CalendarDays size={16} />}>
                    설정 화면으로
                  </Button>
                  <Button variant="primary" onClick={() => setMyEditOpen(true)} icon={<Plus size={16} />}>
                    내 일정 추가/수정
                  </Button>
                </div>
              </div>

              <div style={{ height: 12 }} />

              <SharedCalendar
                title="내 캘린더 미리보기"
                cursor={myCursor}
                setCursor={setMyCursor}
                monthDays={myMonthDays}
                monthStart={myMonthStart}
                eventsForDate={(d) => myEventsForDate(d)}
                selections={[]}
                draftDrag={null}
                onDayMouseDown={() => {}}
                onDayMouseEnter={() => {}}
                interactive={false}
              />
            </div>

            <Modal
              open={myEditOpen}
              title="내 캘린더 수정 — 일정(중복 가능) 추가/삭제"
              onClose={() => {
                setMyEditOpen(false);
                resetMyDraft();
              }}
              footer={
                <>
                  <Button variant="ghost" onClick={() => setMyEditOpen(false)} icon={<X size={16} />}>
                    닫기
                  </Button>
                  <Button variant="soft" onClick={resetMyDraft} icon={<X size={16} />}>
                    날짜 선택 초기화
                  </Button>
                  <Button variant="primary" onClick={addMyEvent} icon={<Plus size={16} />} disabled={!canAddMyEvent}>
                    일정 추가
                  </Button>
                </>
              }
            >
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ ...card, padding: 14 }}>
                  <div style={{ fontWeight: 1100, marginBottom: 6 }}>추가 방법</div>
                  <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.88, lineHeight: 1.55 }}>
                    1) 아래 캘린더에서 날짜 범위를 <b>드래그</b>로 선택<br />
                    2) 제목/시간대/장소 입력<br />
                    3) “일정 추가” 누르면 목록에 쌓입니다 (겹쳐도 OK)
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                  <div style={{ ...card, padding: 14, display: "grid", gap: 10 }}>
                    <div style={labelSmall}>제목</div>
                    <input style={input} value={myTitle} onChange={(e) => setMyTitle(e.target.value)} placeholder="예) 수업 / 회의" />

                    <TimeRangePicker
                      label="시간대(30분 단위)"
                      start={myStartTime}
                      end={myEndTime}
                      onChangeStart={(v) => {
                        setMyStartTime(v);
                        if (!isValidTimeRange(v, myEndTime)) {
                          const next = TIME_OPTIONS.find((t) => timeToMin(t) > timeToMin(v)) ?? "09:30";
                          setMyEndTime(next);
                        }
                      }}
                      onChangeEnd={setMyEndTime}
                      inputStyle={input}
                    />

                    <div style={labelSmall}>장소</div>
                    <input style={input} value={myPlaceText} onChange={(e) => setMyPlaceText(e.target.value)} placeholder="예) 온라인" />

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Pill text={myStartISO && myEndISO ? `${myStartISO} ~ ${myEndISO}` : "날짜 범위 선택 필요"} color="#f59e0b" icon={<CalendarDays size={14} />} />
                      <Pill text={`${myStartTime}~${myEndTime}`} color="#a855f7" icon={<Clock size={14} />} />
                      <Pill text="중복 일정 OK" color="#22c55e" icon={<CheckCircle2 size={14} />} />
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 10 }}>
                      <div style={{ fontWeight: 1100, marginBottom: 8 }}>현재 일정</div>
                      {myCalendarEvents.length === 0 ? (
                        <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 850 }}>아직 일정이 없어요.</div>
                      ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                          {myCalendarEvents.slice(0, 8).map((e) => (
                            <div
                              key={e.id}
                              style={{
                                padding: 12,
                                borderRadius: 16,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <span style={{ width: 10, height: 10, borderRadius: 999, background: e.color }} />
                                  <div style={{ fontWeight: 1100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900, marginTop: 6 }}>
                                  {e.startDate} ~ {e.endDate} / {e.startTime}~{e.endTime} · {e.placeText}
                                </div>
                              </div>
                              <Button variant="ghost" onClick={() => deleteMyEvent(e.id)} icon={<X size={16} />}>
                                삭제
                              </Button>
                            </div>
                          ))}
                          {myCalendarEvents.length > 8 ? (
                            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>+ {myCalendarEvents.length - 8} more</div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  <SharedCalendar
                    title="날짜 선택(드래그)"
                    cursor={myCursor}
                    setCursor={setMyCursor}
                    monthDays={myMonthDays}
                    monthStart={myMonthStart}
                    eventsForDate={(d) => myEventsForDate(d)}
                    selections={mySelections}
                    draftDrag={myDraft}
                    onDayMouseDown={startMyDrag}
                    onDayMouseEnter={extendMyDrag}
                    onClearSelections={resetMyDraft}
                    interactive={true}
                  />
                </div>
              </div>
            </Modal>
          </div>
        ) : null}

        {/* View: list */}
        {view === "list" ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                ...card,
                padding: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="ghost" onClick={() => setView("category")} icon={<ArrowLeft size={16} />}>
                    Back
                  </Button>
                  <div style={{ fontSize: 20, fontWeight: 1100 }}>
                    {category === "study" ? "스터디 모집" : category === "contest" ? "공모전 팀원 모집" : "프로젝트 모집"}
                  </div>

                  <Button variant="primary" onClick={openCreateRoom} icon={<Plus size={16} />}>
                    방 만들기
                  </Button>
                </div>

                <div style={{ fontSize: 13, opacity: 0.82, fontWeight: 800, marginTop: 6 }}>게시글을 눌러 상세에서 “공유 캘린더 기반 신청”을 진행하세요.</div>
              </div>

              <div style={{ minWidth: 320, width: "min(420px, 100%)" }}>
                <div style={labelSmall}>검색</div>
                <input style={input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="제목/요약/방장/장소" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {postsInCategory.map((p) => (
                <div key={p.id} style={{ ...card, padding: 16, cursor: "pointer" }} onClick={() => openPost(p.id)}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 1100, marginBottom: 6, lineHeight: 1.2 }}>{p.title}</div>
                      <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 800, whiteSpace: "pre-wrap" }}>{p.summary}</div>
                    </div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 16,
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                      title="상세 보기"
                    >
                      <ChevronRight size={18} />
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <Pill text={`방장: ${p.ownerName}`} color="#60a5fa" icon={<Users size={14} />} />
                    <Pill text={p.location} color="#f59e0b" icon={<MapPin size={14} />} />
                  </div>

                  {p.rangeEvents.length > 0 ? (
                    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                      <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 1000 }}>날짜/시간/장소(캘린더 표시)</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {p.rangeEvents.slice(0, 2).map((r) => (
                          <span
                            key={r.id}
                            style={{
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 1000,
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.10)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span style={{ width: 10, height: 10, borderRadius: 999, background: r.color }} />
                            {r.startDate} ~ {r.endDate} / {r.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* 방 만들기 모달 */}
            <Modal
              open={createOpen}
              title="방 만들기 — 제목 / 날짜(캘린더) / 시간대(선택) / 장소 / 모집분야 / 상세설명"
              onClose={closeCreateRoom}
              footer={
                <>
                  <Button variant="ghost" onClick={closeCreateRoom} icon={<X size={16} />}>
                    닫기
                  </Button>
                  <Button variant="soft" onClick={clearCreateDates} icon={<X size={16} />}>
                    날짜 선택 초기화
                  </Button>
                  <Button variant="primary" onClick={createRoom} icon={<Plus size={16} />} disabled={!canCreate}>
                    방 생성
                  </Button>
                </>
              }
            >
                <div style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                  <div style={{ ...card, padding: 14, display: "grid", gap: 10 }}>
                    <div style={labelSmall}>1. 제목</div>
                    <input style={input} value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="예) React 스터디 팀원 모집" />

                    <TimeRangePicker
                      label="2. 시간대(30분 단위)"
                      start={cStartTime}
                      end={cEndTime}
                      onChangeStart={(v) => {
                        setCStartTime(v);
                        if (!isValidTimeRange(v, cEndTime)) {
                          const next = TIME_OPTIONS.find((t) => timeToMin(t) > timeToMin(v)) ?? "19:30";
                          setCEndTime(next);
                        }
                      }}
                      onChangeEnd={setCEndTime}
                      inputStyle={input}
                    />

                    <div style={labelSmall}>3. 장소</div>
                    <input style={input} value={cPlace} onChange={(e) => setCPlace(e.target.value)} placeholder="예) 도서관 2층 / 온라인" />

                    <div style={labelSmall}>4. 모집분야</div>
                    <input style={input} value={cField} onChange={(e) => setCField(e.target.value)} placeholder="예) 프론트 1, 백엔드 1, 디자이너 1" />

                    <div style={labelSmall}>5. 상세설명</div>
                    <textarea
                      style={{ ...input, resize: "none", height: 140, fontWeight: 850 }}
                      value={cDetail}
                      onChange={(e) => setCDetail(e.target.value)}
                      placeholder="자유롭게 작성하세요. 목표/진행방식/원하는 팀원 성향 등"
                    />

                    <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 10 }}>
                      <Pill text={`카테고리: ${category}`} color="#22c55e" icon={<List size={14} />} />
                      <Pill text={`방장: ${userName}`} color="#60a5fa" icon={<User size={14} />} />
                      <Pill text={cStartISO && cEndISO ? `${cStartISO} ~ ${cEndISO}` : "날짜: 아직 선택 안함"} color="#f59e0b" icon={<CalendarDays size={14} />} />
                      <Pill text={`${cStartTime}~${cEndTime}`} color="#a855f7" icon={<Clock size={14} />} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    <SharedCalendar
                      title="날짜 선택 (드래그로 시작~종료)"
                      cursor={createCursor}
                      setCursor={setCreateCursor}
                      monthDays={cMonthDays}
                      monthStart={cMonthStart}
                      eventsForDate={(d) => createPreviewEventsForDate(d)}
                      selections={createSelections}
                      draftDrag={createDraft}
                      onDayMouseDown={cStartDrag}
                      onDayMouseEnter={cExtendDrag}
                      onClearSelections={clearCreateDates}
                      interactive={true}
                    />

                    <div style={{ ...card, padding: 14 }}>
                      <div style={{ fontWeight: 1100, marginBottom: 8 }}>캘린더 표시 규칙</div>
                      <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.88, lineHeight: 1.55 }}>
                        선택한 날짜 범위(start~end)의 <b>모든 날짜 칸</b>에<br />
                        <b>“시간대 · 장소”</b>가 바 형태로 표시됩니다.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Modal>
          </div>
        ) : null}

        {/* View: detail */}
        {view === "detail" && activePost ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ ...card, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="ghost" onClick={() => setView("list")} icon={<ArrowLeft size={16} />}>
                      Back
                    </Button>
                    <div style={{ fontSize: 20, fontWeight: 1100, lineHeight: 1.2 }}>{activePost.title}</div>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <Pill text={`방장: ${activePost.ownerName}`} color="#60a5fa" icon={<Users size={14} />} />
                    <Pill text={activePost.location} color="#f59e0b" icon={<MapPin size={14} />} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Button variant="primary" onClick={openApply} icon={<CheckCircle2 size={16} />}>
                    신청하기
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: 14, whiteSpace: "pre-wrap", fontSize: 13, fontWeight: 850, opacity: 0.9 }}>{activePost.body}</div>
            </div>

            <SharedCalendar
              title="모집방 공유 캘린더 (날짜/시간/장소 표시)"
              cursor={cursor}
              setCursor={setCursor}
              monthDays={monthDays}
              monthStart={monthStart}
              eventsForDate={(d) => eventsForDate(activePost, d)}
              selections={[]}
              draftDrag={null}
              onDayMouseDown={() => {}}
              onDayMouseEnter={() => {}}
              interactive={false}
            />

            <div style={{ ...card, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 1100, marginBottom: 6 }}>핵심 기능</div>
                  <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 850 }}>
                    “신청하기”를 누른 뒤, 캘린더에서 <b>가능 날짜(여러 구간)</b>를 드래그로 선택하고, <b>시간대</b>를 지정해 전송합니다.
                  </div>
                </div>
                <Button variant="primary" onClick={openApply} icon={<Send size={16} />}>
                  신청하기 열기
                </Button>
              </div>
            </div>

            {isOwner ? (
              <div style={{ ...card, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 1100, marginBottom: 10 }}>방장 Inbox (데모)</div>
                {inboxForActivePost.length === 0 ? (
                  <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 850 }}>아직 신청이 없어요. 다른 닉네임으로 로그인해서 신청해보면 여기에 쌓입니다.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {inboxForActivePost.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          padding: 12,
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        <div style={{ fontWeight: 1100 }}>
                          {a.applicant} 님 신청
                          <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.75, fontWeight: 900 }}>{a.createdAt}</span>
                        </div>

                        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Pill text={`시간대: ${a.startTime}~${a.endTime}`} color="#a855f7" icon={<Clock size={14} />} />
                          {a.duplicate ? <Pill text="중복 일정 신청" color="#ef4444" icon={<X size={14} />} /> : null}
                        </div>

                        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 900, opacity: 0.9 }}>가능 날짜:</div>
                        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {a.ranges.map((r) => (
                            <span
                              key={r.id}
                              style={{
                                borderRadius: 999,
                                padding: "6px 10px",
                                fontSize: 12,
                                fontWeight: 1000,
                                background: "rgba(99,102,241,0.18)",
                                border: "1px solid rgba(99,102,241,0.30)",
                              }}
                            >
                              {r.startDate} ~ {r.endDate}
                            </span>
                          ))}
                        </div>

                        {a.note ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85, fontWeight: 900, whiteSpace: "pre-wrap" }}>메모: {a.note}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Apply Modal */}
            <Modal
              open={applyOpen}
              title="신청하기 — 가능한 날짜(여러 구간) + 시간대 선택 후 방장에게 전송"
              onClose={() => {
                setApplyOpen(false);
                setDragging(false);
                setDragStartISO(null);
                setDragEndISO(null);
                setAllowDuplicateApply(false);
              }}
              footer={
                <>
                  <Button variant="ghost" onClick={() => setApplyOpen(false)} icon={<X size={16} />}>
                    닫기
                  </Button>
                  <Button variant="soft" onClick={clearMySelections} icon={<X size={16} />}>
                    선택 초기화
                  </Button>
                  <Button
                    variant={allowDuplicateApply ? "danger" : "primary"}
                    onClick={sendToOwner}
                    icon={<Send size={16} />}
                    disabled={(mySelectionsByPost[activePost.id]?.length ?? 0) === 0 || !isValidTimeRange(applyStartTime, applyEndTime)}
                  >
                    방장에게 전송
                  </Button>
                </>
              }
            >
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ ...card, padding: 14 }}>
                  <div style={{ fontWeight: 1100, marginBottom: 6 }}>안내) 신청 프로세스</div>
                  <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.88, lineHeight: 1.5 }}>
                    1) 아래 캘린더에서 가능한 날짜를 <b>마우스로 누른 채 드래그</b>해 범위를 선택합니다.<br />
                    2) 여러 번 드래그해서 <b>여러 구간</b>을 추가할 수 있습니다.<br />
                    3) 시간대를 선택하고 “방장에게 전송”을 누릅니다.<br />
                    4) 내 일정/내 방/내 신청과 <b>날짜+시간</b>이 겹치면 <b>1회 경고 후 취소</b>됩니다. (재전송 시 중복 신청 허용)
                  </div>
                </div>

                <div style={{ ...card, padding: 14 }}>
                  <TimeRangePicker
                    label="신청 시간대(30분 단위)"
                    start={applyStartTime}
                    end={applyEndTime}
                    onChangeStart={(v) => {
                      setApplyStartTime(v);
                      if (!isValidTimeRange(v, applyEndTime)) {
                        const next = TIME_OPTIONS.find((t) => timeToMin(t) > timeToMin(v)) ?? "19:30";
                        setApplyEndTime(next);
                      }
                    }}
                    onChangeEnd={setApplyEndTime}
                    inputStyle={input}
                  />
                  {allowDuplicateApply ? (
                    <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, opacity: 0.9, color: "#f59e0b" }}>
                      경고가 1회 발생했습니다. 다시 전송하면 중복일정으로 신청됩니다.
                    </div>
                  ) : null}
                </div>

                <SharedCalendar
                  title="가능 날짜 선택(드래그) — (내 일정도 함께 표시됨)"
                  cursor={cursor}
                  setCursor={setCursor}
                  monthDays={monthDays}
                  monthStart={monthStart}
                  eventsForDate={(d) => {
                    // 모집방 이벤트 + 내 캘린더 이벤트를 같이 보여줌(자동 참고용)
                    const a = eventsForDate(activePost, d);
                    const b = myEventsForDate(d);
                    return [...a, ...b];
                  }}
                  selections={currentSelections}
                  draftDrag={draftDrag}
                  onDayMouseDown={startDrag}
                  onDayMouseEnter={extendDrag}
                  onClearSelections={clearMySelections}
                  interactive={true}
                />

                <div style={{ ...card, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <Pill text={`신청자: ${userName}`} color="#60a5fa" icon={<User size={14} />} />
                    <Pill text={`방장: ${activePost.ownerName}`} color="#22c55e" icon={<Users size={14} />} />
                    <Pill text={`시간대: ${applyStartTime}~${applyEndTime}`} color="#a855f7" icon={<Clock size={14} />} />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={labelSmall}>방장에게 전달할 메모(선택)</div>
                    <textarea
                      value={applyNote}
                      onChange={(e) => setApplyNote(e.target.value)}
                      rows={3}
                      style={{ ...input, resize: "none", fontWeight: 850 }}
                      placeholder="예) 저는 주로 저녁 가능해요 / 온라인 선호 / 특정 날짜는 불가 등"
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 1100, marginBottom: 8 }}>내가 선택한 가능 날짜</div>
                    {currentSelections.length === 0 ? (
                      <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 900 }}>아직 선택이 없어요. 캘린더에서 드래그로 구간을 추가하세요.</div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {currentSelections.map((r) => (
                          <span
                            key={r.id}
                            style={{
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 1000,
                              background: "rgba(99,102,241,0.18)",
                              border: "1px solid rgba(99,102,241,0.30)",
                            }}
                          >
                            {r.startDate} ~ {r.endDate}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Modal>
          </div>
        ) : null}

        <div style={{ height: 22 }} />

        <div style={{ opacity: 0.8, fontSize: 12, fontWeight: 900 }}>
          Demo Note) 내 캘린더/방 만들기/신청 데이터는 로컬 state로 저장됩니다. 실제 서비스는 DB/API로 교체하면 됩니다.
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Category Card UI
// -----------------------------
function CategoryCard({
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
      onMouseEnter={(e) => (((e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"))}
      onMouseLeave={(e) => (((e.currentTarget as HTMLDivElement).style.transform = "translateY(0px)"))}
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
        클릭 → 게시글 리스트(방 만들기) → 상세 → 신청하기 → 날짜 드래그 + 시간대 선택 → 전송
      </div>
    </div>
  );
}

