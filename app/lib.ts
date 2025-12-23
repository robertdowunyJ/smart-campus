// lib.ts
// ✅ 목적: "JSX 없는 것" 전부 (types + utils + dummy data)

export type Category = "study" | "contest" | "project";

export type WeeklySlot = {
  id: string;
  label: string;
  dayOfWeek: number; // 0=Sun..6=Sat
  time: string; // "18:30"
  color: string;
};

export type RangeEvent = {
  id: string;
  label: string; // 캘린더 바에 표시할 텍스트
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string;
};

export type RecruitPost = {
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

export type AvailabilityRange = {
  id: string;
  startDate: string;
  endDate: string;
};

export type Application = {
  id: string;
  postId: string;
  postTitle: string;
  applicant: string;
  ranges: AvailabilityRange[];
  createdAt: string; // readable
  note?: string;
};

// 내 캘린더(본인 일정)
export type MyCalendarEvent = RangeEvent & {
  title: string;
  timeText: string;
  placeText: string;
};

// -----------------------------
// Date/ID Utils
// -----------------------------
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function clampNoon(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

export function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return clampNoon(new Date(y, (m || 1) - 1, d || 1));
}

export function todayISO() {
  return toISO(new Date());
}

export function addIsoDays(iso: string, days: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function betweenISO(dayISO: string, startISO: string, endISO: string) {
  const day = parseISO(dayISO).getTime();
  const s = parseISO(startISO).getTime();
  const e = parseISO(endISO).getTime();
  return day >= s && day <= e;
}

export function normalizeRange(aISO: string, bISO: string) {
  const a = parseISO(aISO).getTime();
  const b = parseISO(bISO).getTime();
  if (a <= b) return { start: aISO, end: bISO };
  return { start: bISO, end: aISO };
}

export function fmtKoreanMonthTitle(cursor: Date) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth() + 1;
  return `${y}.${String(m).padStart(2, "0")}`;
}

export function dayName(dow: number) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow] ?? "";
}

export function nowLabel() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export function pickEventColor() {
  const colors = ["#6366f1", "#22c55e", "#f59e0b", "#a855f7", "#0ea5e9", "#ef4444", "#ec4899"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// -----------------------------
// Dummy Data (초기값)
// -----------------------------
export const INITIAL_POSTS: RecruitPost[] = [
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
