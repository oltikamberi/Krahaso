import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { sellerApiUrl } from "@/lib/seller-api";
import { SELLER_COOKIE } from "@/lib/seller-session";

/**
 * Attaches the seller's token to dashboard API calls. The browser only ever
 * talks to this origin, so the token can stay in an httpOnly cookie.
 */
async function forward(request: NextRequest, params: Promise<{ path: string[] }>) {
  const token = (await cookies()).get(SELLER_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: "Sesioni ka skaduar. Hyr përsëri." }, { status: 401 });
  }

  const { path } = await params;
  const target = sellerApiUrl(`/api/seller/${path.join("/")}${request.nextUrl.search}`);

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const body = await response.arrayBuffer();
  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, context.params);
}
