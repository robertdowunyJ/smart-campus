"use client";

import { useMemo, useState } from "react";

type Post = {
  id: string;
  title: string;
  summary: string; // hover tooltip text
  // recurrence: weekly on dayOfWeek
  dayOfWeek: number; // 0=Sun ... 6=Sat
  time: string; // "14:00"
  location: string;
  color: string; // tailwind-like color class name OR css color
};

const DUMMY_POSTS: Post[] = [
  {
    id: "p1",
    title: "Frontend Study",
    summary: "Frontend Study (Every Sat 14:00)",
    dayOfWeek: 6,
    time: "14:00",
    location: "Campus Library",
    color: "#6366f1", // indigo
  },
  {
    id: "p2",
    title: "Hackathon Team Up",
    summary: "Hackathon Team Up (Every Wed 20:00)",
    dayOfWeek: 3,
    time: "20:00",
    location: "Online",
    color: "#22c55e", // green
  },
  {
    id: "p3",
    title: "React Beginner",
    summary: "React Beginner (Every Tue 18:30)",
    dayOfWeek: 2,
    time: "18:30",
    location: "Room 201",
    color: "#f59e0b", // amber
  },
];

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
function fmtYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const [cursor, setCursor] = useState(() => new Date());
  const [hover, setHover] = useState<{
    post: Post;
    date: Date;
    x: number;
    y: number;
  } | null>(null);

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const monthEnd = useMemo(() => endOfMonth(cursor), [cursor]);

  // Build a 6-week grid (42 cells)
  const calendarDays = useMemo(() => {
    const start = new Date(monthStart);
    // move back to Sunday of the first week
    start.setDate(start.getDate() - start.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) days.push(addDays(start, i));
    return days;
  }, [monthStart]);

  const title = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth() + 1;
    return `${y}.${String(m).padStart(2, "0")}`;
  }, [cursor]);

  const postsForDate = (d: Date) => {
    const dow = d.getDay(); // 0..6
    return DUMMY_POSTS.filter((p) => p.dayOfWeek === dow).sort((a, b) =>
      a.time.localeCompare(b.time)
    );
  };

  return (
    <main style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
            Smart Campus Study Calendar
          </h1>
          <p style={{ margin: "6px 0 0", opacity: 0.75 }}>
            Find recruit posts by your free time (calendar-first UI).
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
            style={btnStyle}
          >
            ← Prev
          </button>
          <div style={{ fontWeight: 800, minWidth: 90, textAlign: "center" }}>
            {title}
          </div>
          <button
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            style={btnStyle}
          >
            Next →
          </button>
        </div>
      </header>

      {/* Calendar */}
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Weekday header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            background: "rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
            <div
              key={w}
              style={{
                padding: "10px 12px",
                fontSize: 12,
                fontWeight: 800,
                opacity: 0.85,
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
            gridTemplateColumns: "repeat(7, 1fr)",
            gridAutoRows: 120,
          }}
        >
          {calendarDays.map((d) => {
            const inMonth = isSameMonth(d, monthStart);
            const posts = postsForDate(d);

            return (
              <div
                key={fmtYMD(d)}
                style={{
                  borderRight: "1px solid rgba(255,255,255,0.08)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  padding: 10,
                  opacity: inMonth ? 1 : 0.45,
                  position: "relative",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>
                  {d.getDate()}
                </div>

                {/* bars */}
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {posts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      onMouseEnter={(e) => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setHover({
                          post: p,
                          date: d,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => {
                        // later: navigate to detail page
                        alert(`Open detail: ${p.title}`);
                      }}
                      style={{
                        cursor: "pointer",
                        background: p.color,
                        color: "white",
                        borderRadius: 8,
                        padding: "6px 8px",
                        fontSize: 12,
                        fontWeight: 800,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                      }}
                      title="Hover to preview"
                    >
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>
                        {p.title}
                      </span>
                      <span style={{ opacity: 0.9, marginLeft: 8 }}>{p.time}</span>
                    </div>
                  ))}

                  {posts.length > 3 && (
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      +{posts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hover tooltip */}
        {hover && (
          <div
            style={{
              position: "fixed",
              left: hover.x,
              top: hover.y - 10,
              transform: "translate(-50%, -100%)",
              background: "rgba(15, 15, 20, 0.95)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12,
              padding: 12,
              width: 280,
              zIndex: 50,
              boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 6 }}>
              {hover.post.title}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {hover.post.summary}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
              Location: {hover.post.location}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Date: {fmtYMD(hover.date)} ({["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][hover.date.getDay()]})
            </div>
          </div>
        )}
      </section>

      {/* Hint */}
      <p style={{ marginTop: 14, opacity: 0.75, fontSize: 13 }}>
        Next step: click a bar → detail page with overlay (Recruit schedule vs My schedule).
      </p>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  cursor: "pointer",
};
