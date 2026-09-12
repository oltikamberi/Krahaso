import { cookies } from "next/headers";
import { SELLER_COOKIE } from "@/lib/seller-session";

export async function POST() {
  (await cookies()).delete(SELLER_COOKIE);
  return Response.json({ ok: true });
}
