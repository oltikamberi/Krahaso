import { cookies } from "next/headers";
import { backendErrorMessage, sellerApiUrl } from "@/lib/seller-api";
import { SELLER_COOKIE } from "@/lib/seller-session";

export async function POST(request: Request) {
  const payload = await request.json();

  const res = await fetch(sellerApiUrl("/api/seller/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await backendErrorMessage(res, "Email ose fjalëkalim i pasaktë");
    return Response.json({ message }, { status: res.status });
  }

  const auth = (await res.json()) as { token: string; expiresInSeconds: number };
  (await cookies()).set(SELLER_COOKIE, auth.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: auth.expiresInSeconds,
  });

  return Response.json({ ok: true });
}
