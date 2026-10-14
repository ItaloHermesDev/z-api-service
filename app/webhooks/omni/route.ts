import { timingSafeEqual } from "node:crypto";
import { recordIncoming } from "@/lib/interactions";

function tokenMatches(provided: string, expected: string) {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const expected = process.env.OMNI_WEBHOOK_TOKEN?.trim() ?? "";
  if (expected) {
    const url = new URL(request.url);
    const header = request.headers.get("authorization") ?? "";
    const provided = header.startsWith("Bearer ")
      ? header.slice("Bearer ".length)
      : (url.searchParams.get("token") ?? "");
    if (!tokenMatches(provided, expected)) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const payload: unknown = await request.json().catch(() => null);
  try {
    await recordIncoming(payload);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "webhook");
    return Response.json({ error: "unavailable" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
