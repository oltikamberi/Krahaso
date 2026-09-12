import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FeedPreview } from "@/components/feed-preview";
import { getFeedRows, getFeedSync } from "@/lib/seller-feeds";

export const metadata: Metadata = {
  title: "Parapamja e feed-it — Paneli i shitësit",
};

export default async function FeedPreviewPage({
  params,
}: {
  params: Promise<{ feedId: string; syncId: string }>;
}) {
  const { feedId: feedIdParam, syncId: syncIdParam } = await params;
  const feedId = Number(feedIdParam);
  const syncId = Number(syncIdParam);

  if (!Number.isInteger(feedId) || !Number.isInteger(syncId)) {
    notFound();
  }

  const sync = await getFeedSync(feedId, syncId);
  if (!sync) {
    notFound();
  }

  // Parsing runs in the background, so there may be nothing to show on first load
  const rows = sync.state === "parsing" ? null : await getFeedRows(feedId, syncId);

  return (
    <div className="space-y-5">
      <Link
        href="/panel/integrimet"
        className="inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kthehu te integrimet
      </Link>

      <FeedPreview feedId={feedId} initialSync={sync} initialRows={rows} />
    </div>
  );
}
