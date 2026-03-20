import { NextRequest, NextResponse } from "next/server";

const CRM_BASE = "https://motyplus-2hvb.onrender.com";

async function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const target = `${CRM_BASE}${url.pathname}${url.search}`;

  // Forward the raw body with original content-type (preserves multipart boundary)
  const body = req.method !== "GET" ? await req.blob() : undefined;

  const res = await fetch(target, {
    method: req.method,
    headers: {
      "content-type": req.headers.get("content-type") || "",
    },
    body,
  });

  const data = await res.arrayBuffer();

  return new NextResponse(data, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
