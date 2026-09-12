"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileUp, Loader2, Upload } from "lucide-react";

const ACCEPTED = [".csv", ".tsv", ".xml", ".rss"];

export function FeedUploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    if (!ACCEPTED.some((extension) => file.name.toLowerCase().endsWith(extension))) {
      setError("Formati nuk mbështetet. Përdor CSV ose XML.");
      return;
    }

    setUploading(true);
    setError(null);

    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/seller/feeds/upload", { method: "POST", body });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      setError(payload.message ?? "Ngarkimi dështoi. Provo përsëri.");
      setUploading(false);
      return;
    }

    const { feedId, syncId } = (await res.json()) as { feedId: number; syncId: number };
    router.push(`/panel/integrimet/parapamje/${feedId}/${syncId}`);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl px-6 py-10 text-center transition-colors"
        style={{
          border: `2px dashed ${dragging ? "var(--action)" : "var(--border)"}`,
          backgroundColor: dragging ? "rgba(255,107,74,0.06)" : "transparent",
        }}
      >
        <div
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--brand-soft)" }} />
          ) : (
            <FileUp className="h-5 w-5" style={{ color: "var(--brand-soft)" }} />
          )}
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {uploading ? "Po ngarkohet..." : "Tërhiq skedarin ose kliko për të zgjedhur"}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
          CSV ose XML, deri 20 MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>

      {error && (
        <p
          className="mt-3 rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: "rgba(255,107,74,0.12)", color: "var(--action)" }}
          role="alert"
        >
          {error}
        </p>
      )}

      <div
        className="mt-4 rounded-lg px-3 py-3 text-xs leading-relaxed"
        style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }}
      >
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--foreground)" }}>
          <Upload className="h-3.5 w-3.5" />
          Kolonat e pritura
        </span>
        <p className="mt-1.5">
          emri, marka, kategoria, cmimi, valuta, gjendje, linku, foto, sku — emrat në
          anglisht (name, brand, price, stock, url, image) njihen njësoj.
        </p>
      </div>
    </div>
  );
}
