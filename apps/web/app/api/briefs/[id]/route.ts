import { NextRequest, NextResponse } from "next/server";
import { getBriefById } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brief = await getBriefById(params.id);

    if (!brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    return NextResponse.json(brief);
  } catch (error) {
    console.error("Failed to fetch brief:", error);
    return NextResponse.json(
      { error: "Failed to fetch brief" },
      { status: 500 }
    );
  }
}
