import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { refreshAllYangMing } from "@/services";

/** The scheduled Yang Ming refresh. A scheduler calls it with the cron secret. */
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
