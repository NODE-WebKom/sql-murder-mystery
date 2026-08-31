import { executeCaseQuery } from "@/lib/server/database";
import { isCaseSlug } from "@/lib/cases";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!isCaseSlug(slug)) {
    return Response.json({ ok: false, error: "Case not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("sql" in body) ||
    typeof body.sql !== "string"
  ) {
    return Response.json({ ok: false, error: "A SQL string is required." }, { status: 400 });
  }

  const result = executeCaseQuery(slug, body.sql);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
