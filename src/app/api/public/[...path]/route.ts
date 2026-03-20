import { NextRequest, NextResponse } from "next/server";

const CRM_BASE = "https://motyplus-2hvb.onrender.com";

async function proxy(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const target = `${CRM_BASE}${url.pathname}${url.search}`;

    if (req.method === "GET") {
      const res = await fetch(target);
      const data = await res.arrayBuffer();
      return new NextResponse(data, {
        status: res.status,
        headers: {
          "content-type": res.headers.get("content-type") || "application/json",
        },
      });
    }

    // For POST — re-build FormData to forward cleanly
    const incoming = await req.formData();
    const outgoing = new FormData();

    for (const [key, value] of incoming.entries()) {
      if (value instanceof Blob) {
        outgoing.append(key, value, (value as File).name || "file");
      } else {
        outgoing.append(key, value);
      }
    }

    const res = await fetch(target, {
      method: "POST",
      body: outgoing,
    });

    const data = await res.arrayBuffer();

    return new NextResponse(data, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown proxy error";
    return NextResponse.json({ error: `Proxy error: ${message}` }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
