import { cookies } from "next/headers";
import { sellerApiUrl } from "./seller-api";
import { SELLER_COOKIE } from "./seller-session";
import type { Feed, FeedRowPage, FeedSync } from "./seller-types";

// Server-only: reads the seller's cookie. Client components must not import this.

async function authorized<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get(SELLER_COOKIE)?.value;
  if (!token) return null;

  const res = await fetch(sellerApiUrl(path), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  return res.json() as Promise<T>;
}

export async function getFeeds(): Promise<Feed[]> {
  return (await authorized<Feed[]>("/api/seller/feeds")) ?? [];
}

export async function getFeedSync(feedId: number, syncId: number): Promise<FeedSync | null> {
  return authorized<FeedSync>(`/api/seller/feeds/${feedId}/syncs/${syncId}`);
}

export async function getFeedRows(
  feedId: number,
  syncId: number,
  page = 0,
  size = 50,
): Promise<FeedRowPage | null> {
  return authorized<FeedRowPage>(
    `/api/seller/feeds/${feedId}/syncs/${syncId}/rows?page=${page}&size=${size}`,
  );
}
