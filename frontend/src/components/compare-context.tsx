"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ProductSummary } from "@/lib/types";

const MAX_COMPARE = 4;
const STORAGE_KEY = "krahaso-compare";

interface CompareContextValue {
  items: ProductSummary[];
  toggle: (product: ProductSummary) => void;
  remove: (id: number) => void;
  clear: () => void;
  isSelected: (id: number) => boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ProductSummary[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored) as ProductSummary[]);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const persist = useCallback((next: ProductSummary[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggle = useCallback(
    (product: ProductSummary) => {
      const exists = items.some((item) => item.id === product.id);
      if (exists) {
        persist(items.filter((item) => item.id !== product.id));
      } else if (items.length < MAX_COMPARE) {
        persist([...items, product]);
      }
    },
    [items, persist],
  );

  const remove = useCallback(
    (id: number) => persist(items.filter((item) => item.id !== id)),
    [items, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const isSelected = useCallback(
    (id: number) => items.some((item) => item.id === id),
    [items],
  );

  return (
    <CompareContext.Provider value={{ items, toggle, remove, clear, isSelected }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used inside CompareProvider");
  }
  return context;
}
