import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ingestMscTrackingInfo } from "@/services";

/**
 * Where the Chrome extension posts an MSC `TrackingInfo` answer. The browser
 * is the only thing allowed to fetch that page, so this is MSC's way in.
 */

// The extension's background worker calls from its own origin.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: CORS_HEADERS });

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS_HEADERS });

export const POST = async (request: Request) => {
  const expected = process.env.TRACKING_INGEST_TOKEN;
  if (!expected) {
    throw new Error("Missing required environment variable: TRACKING_INGEST_TOKEN");
  }
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return json({ error: "Unauthorised" }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Body must be the TrackingInfo JSON" }, 400);
  }

  try {
    const outcomes = await ingestMscTrackingInfo(payload, "msc_extension");
    revalidatePath("/");
    revalidatePath("/shipments");
    for (const outcome of outcomes) {
      if (outcome.shipmentUuid) {
        revalidatePath(`/shipments/${outcome.shipmentUuid}`);
      }
    }
    return json({
      outcomes: outcomes.map((outcome) => ({
        trackingNumber: outcome.trackingNumber,
        matched: outcome.shipmentUuid !== null,
        status: outcome.outcome?.status ?? null,
        newEvents: outcome.outcome?.newEvents ?? 0,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read the result";
    return json({ error: message }, 422);
  }
};
