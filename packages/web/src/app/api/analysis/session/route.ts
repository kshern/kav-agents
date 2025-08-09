export const runtime = "nodejs";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const symbol = body?.symbol as string | undefined;
    const analysisId = randomUUID();

    return Response.json(
      {
        success: true,
        data: { analysisId, symbol },
      },
      { status: 200 },
    );
  } catch (e) {
    console.error("Failed to create analysis session:", e);
    return Response.json(
      { success: false, error: "Failed to create analysis session" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({ success: false, error: "Method Not Allowed" }, { status: 405 });
}
