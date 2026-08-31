import { isCaseSlug } from "@/lib/cases";
import { checkVerdict } from "@/lib/server/solutions";
import type { VerdictPayload } from "@/lib/types";

export const runtime = "nodejs";

function isVerdictPayload(value: unknown): value is VerdictPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "culprit" in value &&
    typeof value.culprit === "string" &&
    "method" in value &&
    typeof value.method === "string" &&
    "motive" in value &&
    typeof value.motive === "string" &&
    (!("narrative" in value) || typeof value.narrative === "string")
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!isCaseSlug(slug)) {
    return Response.json({ error: "Case not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isVerdictPayload(body)) {
    return Response.json(
      { error: "Culprit, method, and motive are required." },
      { status: 400 },
    );
  }

  if ([body.culprit, body.method, body.motive].some((value) => value.length > 1_000)) {
    return Response.json({ error: "Verdict fields are too long." }, { status: 400 });
  }

  return Response.json(checkVerdict(slug, body));
}
