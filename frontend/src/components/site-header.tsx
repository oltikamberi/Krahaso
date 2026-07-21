"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      router.push(`/kerko?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Krahaso
        </Link>
        <form onSubmit={submit} className="ml-auto flex w-full max-w-sm items-center gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kërko produkte..."
            aria-label="Kërko produkte"
          />
          <Button type="submit" size="icon" aria-label="Kërko">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
