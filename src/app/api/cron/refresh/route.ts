import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { refreshAllYangMing } from "@/services";

// Shipments are pulled one at a time with a pause between, so a long list
// needs more than the default time limit.
export const maxDuration = 300;

/**
 * The scheduled Yang Ming refresh, run daily by the Vercel cron in
 * vercel.json (04:00 UTC, 07:00 in Riyadh). Vercel sends CRON_SECRET as the
 * Bearer token when that variable is set on the project.
 */
export const GET = async (request: Request) => {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    throw new Error("Missing required environment variable: CRON_SECRET");
  }
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const summary = await refreshAllYangMing();
  revalidatePath("/");
  revalidatePath("/shipments");
  return NextResponse.json(summary);
};
