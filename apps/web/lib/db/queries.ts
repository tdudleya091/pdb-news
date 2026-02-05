import { desc, eq } from "drizzle-orm";
import { db } from "./client";
import { briefs, deliveryLogs, type NewBrief } from "./schema";

export async function saveBrief(brief: NewBrief) {
  const [result] = await db.insert(briefs).values(brief).returning();
  return result;
}

export async function getBriefById(id: string) {
  const [result] = await db.select().from(briefs).where(eq(briefs.id, id));
  return result;
}

export async function getLatestBrief() {
  const [result] = await db
    .select()
    .from(briefs)
    .orderBy(desc(briefs.date))
    .limit(1);
  return result;
}

export async function getTodaysBrief() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [result] = await db
    .select()
    .from(briefs)
    .where(eq(briefs.date, today))
    .limit(1);
  return result;
}

export async function getAllBriefs(limit = 30) {
  return db.select().from(briefs).orderBy(desc(briefs.date)).limit(limit);
}

export async function logDelivery(
  briefId: string,
  channel: string,
  status: "sent" | "failed",
  error?: string
) {
  return db.insert(deliveryLogs).values({
    briefId,
    channel,
    status,
    error,
  });
}

export async function updateDeliveredVia(briefId: string, channel: string) {
  const brief = await getBriefById(briefId);
  if (!brief) return;

  const deliveredVia = (brief.deliveredVia || []) as string[];
  if (!deliveredVia.includes(channel)) {
    deliveredVia.push(channel);
    await db
      .update(briefs)
      .set({ deliveredVia })
      .where(eq(briefs.id, briefId));
  }
}
