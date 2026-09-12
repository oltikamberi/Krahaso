export interface Seller {
  id: number;
  businessName: string;
  taxId: string;
  contactEmail: string;
  verified: boolean;
  createdAt: string;
}

export interface RegisterPayload {
  businessName: string;
  taxId: string;
  contactEmail: string;
  password: string;
}

export interface LoginPayload {
  contactEmail: string;
  password: string;
}

// Feed shapes live here rather than next to the fetchers in seller-feeds.ts, which
// imports next/headers and so cannot be pulled into a client component.

export type FeedType = "upload" | "url" | "api";
export type FeedStatus = "draft" | "pending_review" | "live" | "disabled";
export type SyncState = "parsing" | "parsed" | "applied" | "failed" | "discarded";

export interface Feed {
  id: number;
  type: FeedType;
  label: string | null;
  status: FeedStatus;
  feedUrl: string | null;
  scheduleMinutes: number | null;
  lastSyncedAt: string | null;
  lastStatus: "ok" | "partial" | "failed" | null;
  stale: boolean;
  staleAfterHours: number;
  offerCount: number;
  lastRowsProcessed: number;
  lastRowsFailed: number;
  lastErrorSummary: string | null;
  pendingSyncId: number | null;
  nextPollAt: string | null;
  lastAttemptAt: string | null;
  consecutiveFailures: number;
}

export interface FeedSync {
  id: number;
  feedId: number;
  state: SyncState;
  rowsProcessed: number;
  rowsFailed: number;
  errorSummary: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface FeedRow {
  rowNumber: number;
  sku: string | null;
  name: string | null;
  brand: string | null;
  categorySlug: string | null;
  rawCategory: string | null;
  price: number | null;
  currency: string | null;
  inStock: boolean | null;
  availability: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  error: string | null;
}

export interface FeedRowPage {
  items: FeedRow[];
  page: number;
  totalPages: number;
  totalItems: number;
}

/** Cadences the backend accepts for a polled feed URL. */
export const POLL_INTERVALS = [
  { minutes: 60, label: "Çdo orë" },
  { minutes: 360, label: "Çdo 6 orë" },
  { minutes: 720, label: "Çdo 12 orë" },
  { minutes: 1440, label: "Çdo 24 orë" },
] as const;

export const DEFAULT_POLL_INTERVAL = 360;
