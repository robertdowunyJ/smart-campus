export async function POST(req: Request) {
  const { text } = (await req.json()) as { text?: string };

  const input = (text ?? "").trim();
  if (!input) {
    return Response.json(
      { ok: false, error: "text is required" },
      { status: 400 }
    );
  }

  // ✅ 해커톤 MVP용 "가짜 AI 요약" 로직 (규칙 기반)
  // - 문장 일부를 잘라 요약처럼 보이게
  // - 날짜/시간 키워드 있으면 체크리스트로 뽑아줌
  const short = input.length > 140 ? input.slice(0, 140) + "..." : input;

  const checklist: string[] = [];
  const lowered = input.toLowerCase();

  if (lowered.includes("deadline") || lowered.includes("until")) {
    checklist.push("Check the deadline and add it to your calendar");
  }
  if (lowered.includes("bring") || lowered.includes("required")) {
    checklist.push("Prepare required items/documents");
  }
  if (lowered.includes("location") || lowered.includes("hall")) {
    checklist.push("Confirm the location before you go");
  }
  if (checklist.length === 0) {
    checklist.push("Read the notice carefully and note any action items");
  }

  return Response.json({
    ok: true,
    summary3: [
      "Summary: " + short,
      "Key point: Identify what you must do (submit/apply/attend).",
      "Next: Save important dates and requirements.",
    ],
    checklist,
  });
}
