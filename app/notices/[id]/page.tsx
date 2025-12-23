import { notices } from "../../data/notices";
import NoticeClient from "./NoticeClient";

export default async function NoticeDetailPage({ params }: { params: any }) {
  const { id } = await params; // ✅ Next 버전/환경 차이 안전 처리

  const notice = notices.find((n) => n.id === id);

  if (!notice) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Not Found</h1>
        <p>No notice for id: {String(id)}</p>
        <p>Available ids: {notices.map((n) => n.id).join(", ")}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Back
      </a>

      <h1 style={{ marginBottom: 8 }}>{notice.title}</h1>
      <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>
        {notice.category} - {notice.createdAt}
      </div>

      <p style={{ lineHeight: 1.6 }}>{notice.body}</p>
      <NoticeClient notice={notice} />
    </main>
  );
}
