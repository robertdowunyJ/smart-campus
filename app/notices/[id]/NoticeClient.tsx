"use client";

import { useState } from "react";
import type { Notice } from "../../data/notices";

export default function NoticeClient({ notice }: { notice: Notice }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    summary3: string[];
    checklist: string[];
  }>(null);

  const summarize = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notice.body }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "unknown error");
      setResult({ summary3: data.summary3, checklist: data.checklist });
    } catch (e: any) {
      setResult({
        summary3: ["Failed to summarize: " + (e?.message ?? "error")],
        checklist: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <section style={{ marginTop: 16, border: "2px solid red", padding: 12 }}>
    <div>NoticeClient mounted ✅</div>
      <button onClick={summarize} disabled={loading}>
        {loading ? "Summarizing..." : "AI Summarize"}
      </button>

      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>3-line summary</h3>
          <ul>
            {result.summary3.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>

          <h3 style={{ marginTop: 12 }}>Checklist</h3>
          <ul>
            {result.checklist.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
