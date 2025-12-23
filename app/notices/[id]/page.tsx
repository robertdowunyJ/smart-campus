// page.tsx
// ✅ 목적: Home(상태/흐름/핸들러/렌더 조립)만

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
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
  ChevronRight,
  CalendarDays,
} from "lucide-react";

import {
  INITIAL_POSTS,
  addDays,
  betweenISO,
  normalizeRange,
  nowLabel,
  pickEventColor,
  startOfMonth,
  toISO,
  uid,
  type Application,
  type AvailabilityRange,
  type Category,
  type MyCalendarEvent,
  type RecruitPost,
} from "./lib";

import { Button, CategoryCard, Modal, Pill, SharedCalendar } from "./components";

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
  // ✅ 내 캘린더 state
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

  // 내 캘린더 편집에서 쓰는 드래그 범위
  const [myDragging, setMyDragging] = useState(false);
  const [myDragStartISO, setMyDragStartISO] = useState<string | null>(null);
  const [myDragEndISO, setMyDragEndISO] = useState<string | null>(null);
  const [myStartISO, setMyStartISO] = useState<string | null>(null);
  const [myEndISO, setMyEndISO] = useState<string | null>(null);

  // 내 캘린더 이벤트 입력 폼
  const [myTitle, setMyTitle] = useState("");
  const [myTimeText, setMyTimeText] = useState("");
  const [myPlaceText, setMyPlaceText] = useState("");

  // 내 캘린더 수정 모달(카테고리 화면에서 열기)
  const [myEditOpen, setMyEditOpen] = useState(false);

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
    setMyTimeText("");
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
    return myTitle.trim() && myTimeText.trim() && myPlaceText.trim() && myStartISO && myEndISO;
  }, [myTitle, myTimeText, myPlaceText, myStartISO, myEndISO]);

  const addMyEvent = () => {
    if (!canAddMyEvent) return;
    const start = myStartISO!;
    const end = myEndISO!;
    const color = pickEventColor();
    const title = myTitle.trim();
    const timeText = myTimeText.trim();
    const placeText = myPlaceText.trim();

    const newEv: MyCalendarEvent = {
      id: uid("my"),
      title,
      timeText,
      placeText,
      label: `${title} / ${timeText} · ${placeText}`,
      startDate: start,
      endDate: end,
      color,
    };

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
  // 기존: detail/apply 캘린더 커서
  // -----------------------------
  const [cursor, setCursor] = useState(() => new Date());

  // 기존: apply drag selection state (availability)
  const [dragging, setDragging] = useState(false);
  const [dragStartISO, setDragStartISO] = useState<string | null>(null);
  const [dragEndISO, setDragEndISO] = useState<string | null>(null);

  // applicant selections per post
  const [mySelectionsByPost, setMySelectionsByPost] = useState<Record<string, AvailabilityRange[]>>({});

  // applications inbox by owner
  const [applications, setApplications] = useState<Application[]>([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyNote, setApplyNote] = useState("");

  const selectedPost = useMemo(() => posts.find((p) => p.id === selectedPostId) ?? null, [posts, selectedPostId]);

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
    if (!selectedPost) return [];
    return mySelectionsByPost[selectedPost.id] ?? [];
  }, [mySelectionsByPost, selectedPost]);

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

  // apply drag handlers
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

    // ✅ 로그인 직후: 내 캘린더 설정 화면으로 이동
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
  };

  // navigation helpers
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
    if (!selectedPost) return;
    setApplyOpen(true);
    setApplyNote("");
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
    alert("방장에게 가능한 날짜가 전송되었습니다!");
  };

  const inboxForSelectedPost = useMemo(() => {
    if (!selectedPost) return [];
    return applications.filter((a) => a.postId === selectedPost.id);
  }, [applications, selectedPost]);

  const isOwner = useMemo(() => {
    if (!selectedPost) return false;
    return selectedPost.ownerName === userName;
  }, [selectedPost, userName]);

  // -----------------------------
  // ✅ 방 만들기(Create Room)
  // -----------------------------
  const [createOpen, setCreateOpen] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cTime, setCTime] = useState("");
  const [cPlace, setCPlace] = useState("");
  const [cField, setCField] = useState("");
  const [cDetail, setCDetail] = useState("");

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

  const openCreateRoom = () => {
    setCreateOpen(true);
    setCTitle("");
    setCTime("");
    setCPlace("");
    setCField("");
    setCDetail("");
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
        const timeText = cTime.trim() || "시간(입력)";
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
      cTime.trim().length > 0 &&
      cPlace.trim().length > 0 &&
      !!cStartISO &&
      !!cEndISO
    );
  }, [cTitle, cField, cDetail, cTime, cPlace, cStartISO, cEndISO]);

  const createRoom = () => {
    if (!canCreate) return;
    const start = cStartISO!;
    const end = cEndISO!;
    const color = pickEventColor();

    const newPost: RecruitPost = {
      id: uid("post"),
      category,
      title: cTitle.trim(),
      summary: `${cField.trim()} · ${cTime.trim()} · ${cPlace.trim()}`,
      body:
        `1. 제목: ${cTitle.trim()}\n` +
        `2. 날짜/시간/장소: ${start} ~ ${end} / ${cTime.trim()} / ${cPlace.trim()}\n` +
        `3. 모집분야: ${cField.trim()}\n` +
        `4. 상세설명:\n${cDetail.trim()}\n`,
      ownerName: userName,
      location: cPlace.trim(),
      weeklySlots: [],
      rangeEvents: [
        {
          id: uid("re"),
          label: `${cTime.trim()} · ${cPlace.trim()}`,
          startDate: start,
          endDate: end,
          color,
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
                (추가) 로그인 → 내 캘린더 설정 → 카테고리 화면 아래에 내 캘린더 표시
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
                  1) 로그인 → 2) 내 캘린더 설정(여러 일정 중복 추가) → 3) 카테고리 선택 화면(아래에 내 캘린더 표시)
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
                    일정은 <b>날짜(드래그 선택)</b> + <b>제목/시간/장소</b>로 등록됩니다.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="ghost" onClick={goCategory} icon={<ArrowLeft size={16} />}>
                    건너뛰고 카테고리로
                  </Button>
                  <Button variant="primary" onClick={goCategory} icon={<CheckCircle2 size={16} />}>
                    완료하고 카테고리로
                  </Button>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {/* left */}
              <div style={{ ...card, padding: 16, display: "grid", gap: 12 }}>
                <div style={{ fontWeight: 1100, fontSize: 15 }}>일정 추가</div>

                <div>
                  <div style={labelSmall}>제목</div>
                  <input style={input} value={myTitle} onChange={(e) => setMyTitle(e.target.value)} placeholder="예) 수업 / 알바 / 회의 / 스터디" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={labelSmall}>시간</div>
                    <input style={input} value={myTimeText} onChange={(e) => setMyTimeText(e.target.value)} placeholder="예) 19:00~21:00" />
                  </div>
                  <div>
                    <div style={labelSmall}>장소</div>
                    <input style={input} value={myPlaceText} onChange={(e) => setMyPlaceText(e.target.value)} placeholder="예) 도서관 / 온라인" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Pill text={`사용자: ${userName}`} color="#60a5fa" icon={<User size={14} />} />
                  <Pill
                    text={myStartISO && myEndISO ? `${myStartISO} ~ ${myEndISO}` : "날짜 범위 선택 필요"}
                    color="#f59e0b"
                    icon={<CalendarDays size={14} />}
                  />
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
                              {e.startDate} ~ {e.endDate} / {e.timeText} · {e.placeText}
                            </div>
                          </div>
                          <Button variant="ghost" onClick={() => deleteMyEvent(e.id)} icon={<X size={16} />}>
                            삭제
                          </Button>
                        </div>
                      ))}
                      {myCalendarEvents.length > 12 ? (
                        <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>
                          + {myCalendarEvents.length - 12} more
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* right */}
              <div style={{ display: "grid", gap: 12 }}>
                <SharedCalendar
                  title="내 캘린더 (날짜 범위 드래그 선택)"
                  cursor={myCursor}
                  setCursor={setMyCursor}
                  monthDays={myMonthDays}
                  monthStart={myMonthStart}
                  eventsForDate={(d) => myEventsForDate(d)}
                  selections={[]}
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
                    - 제목/시간/장소를 입력하고 <b>일정 추가</b>를 누르면 목록에 쌓입니다.<br />
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

            {/* 내 캘린더 */}
            <div style={{ ...card, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 1100, marginBottom: 6 }}>내 캘린더</div>
                  <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 850 }}>
                    로그인 후 설정한 내 일정이 여기 표시됩니다. (겹쳐도 OK)
                  </div>
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
                    2) 제목/시간/장소 입력<br />
                    3) “일정 추가” 누르면 목록에 쌓입니다 (겹쳐도 OK)
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 12 }}>
                  <div style={{ ...card, padding: 14, display: "grid", gap: 10 }}>
                    <div style={labelSmall}>제목</div>
                    <input style={input} value={myTitle} onChange={(e) => setMyTitle(e.target.value)} placeholder="예) 수업 / 회의" />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <div style={labelSmall}>시간</div>
                        <input style={input} value={myTimeText} onChange={(e) => setMyTimeText(e.target.value)} placeholder="예) 19:00~21:00" />
                      </div>
                      <div>
                        <div style={labelSmall}>장소</div>
                        <input style={input} value={myPlaceText} onChange={(e) => setMyPlaceText(e.target.value)} placeholder="예) 온라인" />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Pill
                        text={myStartISO && myEndISO ? `${myStartISO} ~ ${myEndISO}` : "날짜 범위 선택 필요"}
                        color="#f59e0b"
                        icon={<CalendarDays size={14} />}
                      />
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
                                  <div style={{ fontWeight: 1100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {e.title}
                                  </div>
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900, marginTop: 6 }}>
                                  {e.startDate} ~ {e.endDate} / {e.timeText} · {e.placeText}
                                </div>
                              </div>
                              <Button variant="ghost" onClick={() => deleteMyEvent(e.id)} icon={<X size={16} />}>
                                삭제
                              </Button>
                            </div>
                          ))}
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
                    selections={[]}
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

                <div style={{ fontSize: 13, opacity: 0.82, fontWeight: 800, marginTop: 6 }}>
                  게시글을 눌러 상세에서 “공유 캘린더 기반 신청”을 진행하세요.
                </div>
              </div>

              <div style={{ minWidth: 320, width: "min(420px, 100%)" }}>
                <div style={labelSmall}>검색</div>
                <input style={input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="제목/요약/방장/장소" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
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
                        border: "1px solid rgba(2
