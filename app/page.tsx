import { notices } from "./data/notices";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Notice Helper</h1>
      <p>Notice list (dummy data)</p>

      <ul style={{ marginTop: 16 }}>
        {notices.map((n) => (
          <li key={n.id} style={{ marginBottom: 12 }}>
            <a href={`/notices/${n.id}`} style={{ fontWeight: 700, display: "inline-block" }}>
  {n.title}
</a>

            <div style={{ fontSize: 14, opacity: 0.8 }}>
              {n.category} - {n.createdAt}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
