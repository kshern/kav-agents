import { NextRequest, NextResponse } from "next/server";
import { readEvents } from "@/server/analysisStore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const analysisId = searchParams.get("analysisId") || searchParams.get("id");

  if (!analysisId) {
    return NextResponse.json(
      { success: false, error: "analysisId is required" },
      { status: 400 },
    );
  }

  try {
    const events = await readEvents(analysisId);
    return NextResponse.json({ success: true, data: events }, { status: 200 });
  } catch (e) {
    console.error("Failed to read cache events:", e);
    return NextResponse.json(
      { success: false, error: "Failed to read cache" },
      { status: 500 },
    );
  }
}
