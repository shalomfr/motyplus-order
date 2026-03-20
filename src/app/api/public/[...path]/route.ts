import { NextRequest, NextResponse } from "next/server";

const CRM_BASE = "https://motyplus-2hvb.onrender.com";

async function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const target = `${CRM_BASE}${url.pathname}${url.search}`;

  const headers: Record<string, string> = {
    "user-agent": req.headers.get("user-agent") || "",
  };

  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers["content-type"] = contentType;
  }

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method !== "GET" ? await req.arrayBuffer() : undefined,
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
