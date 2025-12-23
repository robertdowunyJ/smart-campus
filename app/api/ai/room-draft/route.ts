import { NextResponse } from "next/server";

export const runtime = "nodejs";

function pickFirstMatch(text: string, patterns: RegExp[]) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1] ?? m[0];
  }
  return null;
}

function normalizeTimeRange(text: string) {
  // 15~16시 / 15-16시 / 15:00~16:30 / 3pm~5pm(미지원)
  const m =
    text.match(/(\d{1,2})(?::(\d{2}))?\s*(?:~|-|—)\s*(\d{1,2})(?::(\d{2}))?\s*시?/);
  if (!m) return null;

  const sh = m[1].padStart(2, "0");
  const sm = (m[2] ?? "00").padStart(2, "0");
  const eh = m[3].padStart(2, "0");
  const em = (m[4] ?? "00").padStart(2, "0");
  return `${sh}:${sm}~${eh}:${em}`;
}

function guessPlaceSuggestions(text: string) {
  const base = ["중앙도서관 2층", "학생회관 카페", "온라인(디코)"];
  const s: string[] = [];

  if (/(도서관|열람실)/.test(text)) s.push("중앙도서관 2층");
  if (/(카페|스터디카페|카공)/.test(text)) s.push("학생회관 카페");
  if (/(온라인|디코|디스코드|줌|zoom)/i.test(text)) s.push("온라인(디코)");
  if (/(성수|건대|홍대|강남)/.test(text)) s.push("캠퍼스 근처 카페(협의)");

  // 중복 제거 + fallback
  const uniq = Array.from(new Set([...s, ...base]));
  return uniq.slice(0, 4);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userText: string = body?.userText ?? "";
    if (!userText.trim()) {
      return NextResponse.json({ error: "userText is required" }, { status: 400 });
    }

    // 1) 주제(알고리즘/React/토익/프로젝트 등) 대충 추출
    const topic =
      pickFirstMatch(userText, [
        /(알고리즘)/,
        /(코딩테스트)/,
        /(React)/i,
        /(프론트)/,
        /(백엔드)/,
        /(면접)/,
        /(토익)/,
        /(영어)/,
        /(자격증)/,
        /(프로젝트)/,
      ]) ?? "스터디";

    // 2) 인원
    const headcount =
      pickFirstMatch(userText, [/(\d+)\s*명/, /모집\s*(\d+)\s*명/]) ?? null;

    // 3) 시간 범위
    const timeRange = normalizeTimeRange(userText);

    // 4) 장소 힌트
    const placeHint =
      pickFirstMatch(userText, [
        /(온라인|디스코드|디코|줌|zoom)/i,
        /(도서관\s*\d*\s*층?)/,
        /(학생회관\s*카페)/,
        /(성수동|건대|홍대|강남)/,
      ]) ?? null;

    const place = /온라인|디스코드|디코|줌|zoom/i.test(placeHint ?? "")
      ? "온라인(디스코드)"
      : placeHint
      ? placeHint
      : "캠퍼스 내(협의)";

    const title = `${topic} 스터디${headcount ? ` ${headcount}명 모집` : " 모집"}`;

    // 모집분야(간단)
    const field = /프로젝트|개발|프론트|백엔드|React/i.test(userText)
  ? "모집: 프론트 1, 백 1 (협의 가능)"
  : "모집: 함께 공부할 분 (초보/중급 환영)";


    const detailLines = [
      `주제: ${topic}`,
      headcount ? `인원: ${headcount}명 내외` : `인원: 협의`,
      timeRange ? `시간: ${timeRange}` : `시간: 협의(댓글로 맞추기)`,
      `장소: ${place}`,
      `진행: 자료 공유 + 문제풀이/리뷰`,
      `원하는 팀원: 꾸준히 참여 가능한 분`,
    ];

    return NextResponse.json(
      {
        title,
        place,
        field,
        detail: detailLines.join("\n"),
        subLocations: guessPlaceSuggestions(userText),
        rawInput: userText,
      },
      {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON or server error" }, { status: 500 });
  }
}
