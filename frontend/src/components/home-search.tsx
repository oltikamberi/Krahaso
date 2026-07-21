"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      router.push(`/kerko?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xl items-center gap-2">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Kërko një telefon, laptop, televizor..."
        className="h-12 text-base"
        aria-label="Kërko produkte"
      />
      <Button type="submit" size="lg" className="h-12">
        <Search className="mr-1.5 h-4 w-4" />
        Kërko
      </Button>
    </form>
  );
}
