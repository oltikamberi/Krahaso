import { cookies } from "next/headers";
import { SELLER_COOKIE } from "./seller-session";
import type { Seller } from "./seller-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function sellerApiUrl(path: string): string {
  return `${API_URL}${path}`;
}

/** Reads the message the backend put in a ProblemDetail / error body. */
export async function backendErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; message?: string };
    return body.detail ?? body.message ?? fallback;
  } catch {
    return fallback;
  }
}

/** Current seller, or null when there is no valid session. */
export async function getSeller(): Promise<Seller | null> {
  const token = (await cookies()).get(SELLER_COOKIE)?.value;
  if (!token) return null;

  const res = await fetch(sellerApiUrl("/api/seller/me"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  return res.json() as Promise<Seller>;
}
