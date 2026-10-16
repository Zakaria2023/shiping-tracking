import { NextResponse } from "next/server";
import { getDocumentDownloadUrl } from "@/services";

type Context = {
  params: Promise<{ uuid: string }>;
};

/** Opens a shipment document: a redirect to a short-lived signed R2 link. */
export const GET = async (_request: Request, { params }: Context) => {
  const { uuid } = await params;
  const url = await getDocumentDownloadUrl(uuid);
  if (!url) {
    return NextResponse.json({ error: "No such document" }, { status: 404 });
  }
  return NextResponse.redirect(url);
};
