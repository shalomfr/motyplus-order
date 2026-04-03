import { NextRequest, NextResponse } from "next/server";

const CRM_URL = process.env.CRM_URL || "https://motyplus-2hvb.onrender.com";

// GET /pay/[customerId] — proxy to CRM's payment redirect
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Call the CRM's pay endpoint — it creates a payment page and returns a redirect
    const res = await fetch(`${CRM_URL}/pay/${id}`, { redirect: "manual" });

    // If CRM returns a redirect (302), pass it through
    if (res.status === 302 || res.status === 301 || res.status === 307 || res.status === 308) {
      const location = res.headers.get("location");
      if (location) {
        return NextResponse.redirect(location);
      }
    }

    // If CRM returns an error page, pass it through
    const html = await res.text();
    return new NextResponse(html, {
      status: res.status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Pay proxy error:", error);
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>שגיאה</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;direction:rtl}
.card{background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.1);max-width:400px}
h1{color:#e53e3e;font-size:1.3rem}</style>
</head>
<body><div class="card"><h1>⚠️</h1><h1>שירות התשלום אינו זמין כרגע</h1><p>נסה שוב מאוחר יותר</p></div></body>
</html>`;
    return new NextResponse(html, {
      status: 502,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
