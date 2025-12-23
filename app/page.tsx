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
  Clock,
  MapPin,
  Users,
} from "lucide-react";

/**
 * NODE — Recruit Community + Shared Calendar (Single TSX file demo)
 * - Login → Category 선택(스터디/공모전/프로젝트) → 게시글 리스트 → 상세 → (신청) → 드래그로 가능 날짜 선택 → 방장에게 전송
 * - 백엔드/DB 없이 "동작"을 보여주는 프로토타입(로컬 state 저장)
 *
 * 필요: npm i lucide-react
 * 이 파일을 Next.js 페이지(app/page.tsx 또는 pages/index.tsx)에 그대로 붙여넣으면 동작합니다.
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
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string;
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
  rangeEvents: RangeEvent[]; // 마감/집중 기간 등(예시)
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
  createdAt: string; // readable
  note?: string;
};

// -----------------------------
// Dummy Data
// -----------------------------
const POSTS: RecruitPost[] = [
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
      { id: "re1", label: "1주차 목표(기초)", startDate: addIsoDays(todayISO(), 0), endDate: addIsoDays(todayISO(), 6), color: "#f59e0b" },
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
      { id: "re2", label: "마감 주간", startDate: addIsoDays(todayISO(), 10), endDate: addIsoDays(todayISO(), 16), color: "#ef4444" },
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
      { id: "re3", label: "MVP 스프린트", startDate: addIsoDays(todayISO(), 2), endDate: addIsoDays(todayISO(), 12), color: "#22c55e" },
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
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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

function dayName(dow: number) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow] ?? "";
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
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: "min(920px, 100%)",
          borderRadius: 22,
          overflow: "hidden",
          background: "rgba(14,14,20,0.96)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 90px rgba(0,0,0,0.55)",
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={18} />
            <div style={{ fontWeight: 1000, fontSize: 15 }}>{title}</div>
          </div>
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

        <div style={{ padding: 16 }}>{children}</div>

        {footer ? (
          <div
            style={{
              padding: 16,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              background: "rgba(255,255,255,0.03)",
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
// - Shows: post weekly slots + post range events
// - Allows: drag-select availability ranges (for applicant)
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CalendarDays size={18} />
          <div style={{ fontWeight: 1000 }}>{title}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

      {/* Weekday header */}
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

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: 122 }}>
        {monthDays.map((d) => {
          const inMonth = isSameMonth(d, monthStart);
          const iso = toISO(d);
          const evs = eventsForDate(d);
          const selected = selectionContains(iso);

          return (
            <div
              key={iso}
              onMouseDown={() => onDayMouseDown(iso)}
              onMouseEnter={() => onDayMouseEnter(iso)}
              style={{
                borderRight: "1px solid rgba(255,255,255,0.06)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: 10,
                opacity: inMonth ? 1 : 0.40,
                position: "relative",
                cursor: "crosshair",
                background: selected ? "rgba(99,102,241,0.18)" : "transparent",
                transition: "background 120ms ease",
              }}
              title="드래그로 가능 날짜를 선택하세요"
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
                    }}
                    title={e.kind === "weekly" ? "주간 반복 일정(예시)" : "기간 이벤트(예시)"}
                  >
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e.label}
                    </span>
                    {e.time ? <span style={{ opacity: 0.9 }}>{e.time}</span> : null}
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

      <div style={{ padding: 12, fontSize: 12, opacity: 0.85, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        팁) <b>신청자는</b> 가능한 날짜를 <b>드래그로 선택</b> → “방장에게 전송” 하면 됩니다.
      </div>
    </section>
  );
}

// -----------------------------
// Main Page
// -----------------------------
export default function Home() {
  // auth
  const [loggedIn, setLoggedIn] = useState(false);
  const [nameInput, setNameInput] = useState("동호");
  const [userName, setUserName] = useState("동호");

  // view
  type View = "login" | "category" | "list" | "detail";
  const [view, setView] = useState<View>("login");

  const [category, setCategory] = useState<Category>("study");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // list ui
  const [search, setSearch] = useState("");

  // calendar cursor
  const [cursor, setCursor] = useState(() => new Date());

  // drag selection state (availability)
  const [dragging, setDragging] = useState(false);
  const [dragStartISO, setDragStartISO] = useState<string | null>(null);
  const [dragEndISO, setDragEndISO] = useState<string | null>(null);

  // applicant selections per post
  const [mySelectionsByPost, setMySelectionsByPost] = useState<Record<string, AvailabilityRange[]>>({});

  // applications inbox by owner (local demo)
  const [applications, setApplications] = useState<Application[]>([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyNote, setApplyNote] = useState("");

  // tooltip for calendar bars
  const [hover, setHover] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const selectedPost = useMemo(() => POSTS.find((p) => p.id === selectedPostId) ?? null, [selectedPostId]);

  // month compute
  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const monthEnd = useMemo(() => endOfMonth(cursor), [cursor]);

  const monthDays = useMemo(() => {
    const start = new Date(monthStart);
    start.setDate(start.getDate() - start.getDay()); // back to Sunday
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) days.push(addDays(start, i));
    return days;
  }, [monthStart]);

  // derived lists
  const postsInCategory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return POSTS.filter((p) => p.category === category).filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    });
  }, [category, search]);

  // selections for current post
  const currentSelections = useMemo(() => {
    if (!selectedPost) return [];
    return mySelectionsByPost[selectedPost.id] ?? [];
  }, [mySelectionsByPost, selectedPost]);

  const draftDrag = useMemo(() => {
    if (!dragStartISO || !dragEndISO) return null;
    return { startISO: dragStartISO, endISO: dragEndISO };
  }, [dragStartISO, dragEndISO]);

  // event generator for a date (shared calendar content)
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

  // drag handlers
  const startDrag = (iso: string) => {
    if (!applyOpen) return; // 신청 모달에서만 선택 가능하게 (요구사항: 신청하기 후 드래그)
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
    if (!dragging || !selectedPost || !dragStartISO || !dragEndISO) {
      setDragging(false);
      setDragStartISO(null);
      setDragEndISO(null);
      return;
    }

    const nr = normalizeRange(dragStartISO, dragEndISO);
    const newRange: AvailabilityRange = { id: uid("range"), startDate: nr.start, endDate: nr.end };

    setMySelectionsByPost((prev) => {
      const old = prev[selectedPost.id] ?? [];
      return { ...prev, [selectedPost.id]: [newRange, ...old] };
    });

    setDragging(false);
    setDragStartISO(null);
    setDragEndISO(null);
  };

  // global mouseup to finalize
  useEffect(() => {
    const onUp = () => finalizeDrag();
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, dragStartISO, dragEndISO, applyOpen, selectedPostId]);

  // login flow
  const doLogin = () => {
    const n = nameInput.trim();
    if (!n) return;
    setLoggedIn(true);
    setUserName(n);
    setView("category");
  };

  const doLogout = () => {
    setLoggedIn(false);
    setView("login");
    setSelectedPostId(null);
    setApplyOpen(false);
    setHover(null);
    setSearch("");
  };

  // navigation helpers
  const openCategory = (c: Category) => {
    setCategory(c);
    setView("list");
  };

  const openPost = (id: string) => {
    setSelectedPostId(id);
    setView("detail");
    setCursor(new Date()); // reset month
    setApplyOpen(false);
    setHover(null);
  };

  // apply flow
  const openApply = () => {
    if (!selectedPost) return;
    setApplyOpen(true);
    setApplyNote("");
    // keep current selections if any
  };

  const clearMySelections = () => {
    if (!selectedPost) return;
    setMySelectionsByPost((prev) => ({ ...prev, [selectedPost.id]: [] }));
  };

  const sendToOwner = () => {
    if (!selectedPost) return;
    const ranges = mySelectionsByPost[selectedPost.id] ?? [];
    if (ranges.length === 0) return;

    const app: Application = {
      id: uid("app"),
      postId: selectedPost.id,
      postTitle: selectedPost.title,
      applicant: userName,
      ranges,
      createdAt: nowLabel(),
      note: applyNote.trim() || undefined,
    };

    setApplications((prev) => [app, ...prev]);
    setApplyOpen(false);

    // UX: keep selections after send (or clear) — 여기선 유지
    // clearMySelections();
    alert("방장에게 가능한 날짜가 전송되었습니다!");
  };

  // owner inbox for selected post
  const inboxForSelectedPost = useMemo(() => {
    if (!selectedPost) return [];
    return applications.filter((a) => a.postId === selectedPost.id);
  }, [applications, selectedPost]);

  const isOwner = useMemo(() => {
    if (!selectedPost) return false;
    return selectedPost.ownerName === userName;
  }, [selectedPost, userName]);

  // tooltip on hover for list cards (optional)
  const hoverRef = useRef<HTMLDivElement | null>(null);

  // -----------------------------
  // Layout Styles
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
    maxWidth: 1180,
    margin: "0 auto",
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
  };

  const card: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.30)",
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

  const labelSmall: React.CSSProperties = { fontSize: 12, opacity: 0.82, fontWeight: 1000 };

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
                모집글 → 상세 → 신청하기 → 가능한 날짜 드래그 → 방장에게 전송
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

        {/* Views */}
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
                  opacity: 0.9,
                  fontWeight: 900,
                }}
              >
                지금 구현된 기능:
                <div style={{ marginTop: 8, fontWeight: 800, opacity: 0.9 }}>
                  1) 카테고리 선택 → 2) 게시글 리스트 → 3) 상세 보기 → 4) 신청하기 →
                  5) 공유 캘린더에서 가능 날짜 드래그 선택 → 6) 방장에게 전송
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {view === "category" ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ ...card, padding: 18 }}>
              <div style={{ fontSize: 20, fontWeight: 1100, marginBottom: 6 }}>처음 화면</div>
              <div style={{ fontSize: 13, opacity: 0.82, fontWeight: 800 }}>
                스터디 모집 / 공모전 팀원 모집 / 프로젝트 모집 중 하나를 선택하세요.
              </div>
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
          </div>
        ) : null}

        {view === "list" ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ ...card, padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Button variant="ghost" onClick={() => setView("category")} icon={<ArrowLeft size={16} />}>
                    Back
                  </Button>
                  <div style={{ fontSize: 20, fontWeight: 1100 }}>
                    {category === "study" ? "스터디 모집" : category === "contest" ? "공모전 팀원 모집" : "프로젝트 모집"}
                  </div>
                </div>
                <div style={{ fontSize: 13, opacity: 0.82, fontWeight: 800, marginTop: 6 }}>
                  게시글을 눌러 상세에서 “공유 캘린더 기반 신청”을 진행하세요.
                </div>
              </div>

              <div style={{ minWidth: 320, width: "min(420px, 100%)" }}>
                <div style={labelSmall}>검색</div>
                <input
                  style={input}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="제목/요약/방장/장소"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {postsInCategory.map((p) => (
                <div
                  key={p.id}
                  style={{ ...card, padding: 16, cursor: "pointer" }}
                  onClick={() => openPost(p.id)}
                  onMouseMove={(e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    setHover({
                      text: "클릭하면 상세 + 공유 캘린더 신청 기능을 볼 수 있어요",
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 1100, marginBottom: 6, lineHeight: 1.2 }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 800, whiteSpace: "pre-wrap" }}>
                        {p.summary}
                      </div>
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

                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 1000 }}>일정 힌트(예시)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {p.weeklySlots.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
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
                          title="주간 반복 후보 일정(예시)"
                        >
                          <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color }} />
                          {dayName(s.dayOfWeek)} {s.time}
                        </span>
                      ))}
                      {p.weeklySlots.length > 3 ? (
                        <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 1000, alignSelf: "center" }}>
                          +{p.weeklySlots.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hover ? (
              <div
                ref={hoverRef}
                style={{
                  position: "fixed",
                  left: hover.x,
                  top: hover.y - 10,
                  transform: "translate(-50%, -100%)",
                  background: "rgba(15, 15, 20, 0.95)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 14,
                  padding: 12,
                  width: 340,
                  zIndex: 50,
                  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {hover.text}
              </div>
            ) : null}
          </div>
        ) : null}

        {view === "detail" && selectedPost ? (
          <div style={{ display: "grid", gap: 14 }}>
            {/* Detail Header */}
            <div style={{ ...card, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="ghost" onClick={() => setView("list")} icon={<ArrowLeft size={16} />}>
                      Back
                    </Button>
                    <div style={{ fontSize: 20, fontWeight: 1100, lineHeight: 1.2 }}>
                      {selectedPost.title}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <Pill text={`방장: ${selectedPost.ownerName}`} color="#60a5fa" icon={<Users size={14} />} />
                    <Pill text={selectedPost.location} color="#f59e0b" icon={<MapPin size={14} />} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Button variant="primary" onClick={openApply} icon={<CheckCircle2 size={16} />}>
                    신청하기
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: 14, whiteSpace: "pre-wrap", fontSize: 13, fontWeight: 850, opacity: 0.9 }}>
                {selectedPost.body}
              </div>
            </div>

            {/* Shared Calendar (view only) */}
            <SharedCalendar
              title="모집방 공유 캘린더 (이벤트/후보 일정 예시)"
              cursor={cursor}
              setCursor={setCursor}
              monthDays={monthDays}
              monthStart={monthStart}
              eventsForDate={(d) => eventsForDate(selectedPost, d)}
              selections={[]} // 상세 페이지에서는 선택을 강제하지 않음(신청 모달에서만 드래그)
              draftDrag={null}
              onDayMouseDown={() => {}}
              onDayMouseEnter={() => {}}
            />

            {/* Apply panel hint */}
            <div style={{ ...card, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 1100, marginBottom: 6 }}>핵심 기능</div>
                  <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 850 }}>
                    “신청하기”를 누른 뒤, 캘린더에서 <b>가능 날짜를 드래그로 선택</b>하고 방장에게 전송합니다.
                  </div>
                </div>
                <Button variant="primary" onClick={openApply} icon={<Send size={16} />}>
                  신청하기 열기
                </Button>
              </div>
            </div>

            {/* Owner inbox (only if current user is owner) */}
            {isOwner ? (
              <div style={{ ...card, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 1100, marginBottom: 10 }}>방장 Inbox (데모)</div>
                {inboxForSelectedPost.length === 0 ? (
                  <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 850 }}>
                    아직 신청이 없어요. 다른 닉네임으로 로그인해서 신청해보면 여기에 쌓입니다.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {inboxForSelectedPost.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          padding: 12,
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 1100 }}>
                            {a.applicant} 님 신청
                            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.75, fontWeight: 900 }}>{a.createdAt}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 900, opacity: 0.9 }}>
                          가능 날짜:
                        </div>
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

                        {a.note ? (
                          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85, fontWeight: 900 }}>
                            메모: {a.note}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Apply Modal */}
            <Modal
              open={applyOpen}
              title="신청하기 — 가능한 날짜 드래그 선택 후 방장에게 전송"
              onClose={() => {
                setApplyOpen(false);
                setDragging(false);
                setDragStartISO(null);
                setDragEndISO(null);
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
                    variant="primary"
                    onClick={sendToOwner}
                    icon={<Send size={16} />}
                    disabled={(mySelectionsByPost[selectedPost.id]?.length ?? 0) === 0}
                  >
                    방장에게 전송
                  </Button>
                </>
              }
            >
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ ...card, padding: 14 }}>
                  <div style={{ fontWeight: 1100, marginBottom: 6 }}>
                    안내) 신청 프로세스
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.88, lineHeight: 1.5 }}>
                    1) 아래 캘린더에서 가능한 날짜를 <b>마우스로 누른 채 드래그</b>해 범위를 선택합니다.<br />
                    2) 여러 번 드래그해서 <b>여러 구간</b>을 추가할 수 있습니다.<br />
                    3) “방장에게 전송”을 누르면 신청 데이터가 전송됩니다(데모에서는 로컬 inbox에 저장).
                  </div>
                </div>

                {/* Applicant selection calendar */}
                <SharedCalendar
                  title="가능 날짜 선택(드래그)"
                  cursor={cursor}
                  setCursor={setCursor}
                  monthDays={monthDays}
                  monthStart={monthStart}
                  eventsForDate={(d) => eventsForDate(selectedPost, d)}
                  selections={currentSelections}
                  draftDrag={draftDrag}
                  onDayMouseDown={startDrag}
                  onDayMouseEnter={extendDrag}
                  onClearSelections={clearMySelections}
                />

                <div style={{ ...card, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <Pill text={`신청자: ${userName}`} color="#60a5fa" icon={<User size={14} />} />
                    <Pill text={`방장: ${selectedPost.ownerName}`} color="#22c55e" icon={<Users size={14} />} />
                    <Pill text={`이벤트/후보 일정 포함`} color="#f59e0b" icon={<Clock size={14} />} />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={labelSmall}>방장에게 전달할 메모(선택)</div>
                    <textarea
                      value={applyNote}
                      onChange={(e) => setApplyNote(e.target.value)}
                      rows={3}
                      style={{
                        ...input,
                        resize: "none",
                        fontWeight: 850,
                      }}
                      placeholder="예) 저는 주로 저녁 가능해요 / 온라인 선호 / 특정 날짜는 불가 등"
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 1100, marginBottom: 8 }}>
                      내가 선택한 가능 날짜
                    </div>
                    {currentSelections.length === 0 ? (
                      <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 900 }}>
                        아직 선택이 없어요. 캘린더에서 드래그로 구간을 추가하세요.
                      </div>
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

        {/* Safety: if detail but no post */}
        {view === "detail" && !selectedPost ? (
          <div style={{ ...card, padding: 18 }}>
            <div style={{ fontWeight: 1100, fontSize: 16 }}>게시글을 찾지 못했어요</div>
            <div style={{ marginTop: 10 }}>
              <Button variant="ghost" onClick={() => setView("list")} icon={<ArrowLeft size={16} />}>
                Back
              </Button>
            </div>
          </div>
        ) : null}

        <div style={{ height: 22 }} />

        <div style={{ opacity: 0.8, fontSize: 12, fontWeight: 900 }}>
          Demo Note) 이 코드는 “기능 동작”을 보여주는 프로토타입입니다. 다음 단계에서 DB/로그인/룸 권한/API로 실제 서비스화하면 됩니다.
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
        클릭 → 게시글 리스트 → 상세 → 신청하기 → 드래그 선택 → 전송
      </div>
    </div>
  );
}
