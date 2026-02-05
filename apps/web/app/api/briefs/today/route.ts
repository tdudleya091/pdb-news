import { NextResponse } from "next/server";
import { getTodaysBrief, getLatestBrief } from "@/lib/db/queries";

export async function GET() {
  try {
    let brief = await getTodaysBrief();

    if (!brief) {
      brief = await getLatestBrief();
    }

    if (!brief) {
      return NextResponse.json({ error: "No briefs available" }, { status: 404 });
    }

    return NextResponse.json(brief);
  } catch (error) {
    console.error("Failed to fetch today's brief:", error);
    return NextResponse.json(
      { error: "Failed to fetch brief" },
      { status: 500 }
    );
  }
}
