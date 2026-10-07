"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { CartItem } from "@/types";

const STORAGE_KEY = "global-atelier-cart";
const CHANGE_EVENT = "global-atelier-cart-change";

let memorySnapshot = "[]";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  const next = localStorage.getItem(STORAGE_KEY) ?? "[]";

  if (next !== memorySnapshot) memorySnapshot = next;

  return memorySnapshot;
}

function getServerSnapshot() {
  return "[]";
}

function write(items: CartItem[]) {
  memorySnapshot = JSON.stringify(items);
  localStorage.setItem(STORAGE_KEY, memorySnapshot);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function parse(raw: string): CartItem[] {
  try {
    const data = JSON.parse(raw) as unknown;

    if (!Array.isArray(data)) return [];

    return data.flatMap((item) => {
      if (!isCartItem(item)) return [];

      return [{ ...item, originalPrice: item.originalPrice ?? null }];
    });
  } catch {
    return [];
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<CartItem>;

  return (
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.sku === "string" &&
    (typeof item.image === "string" || item.image === null) &&
    (typeof item.size === "string" || item.size === null) &&
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    item.quantity <= 99 &&
    (typeof item.price === "number" || item.price === null) &&
    (item.originalPrice === undefined ||
      item.originalPrice === null ||
      typeof item.originalPrice === "number")
  );
}

function itemKey(item: Pick<CartItem, "productId" | "size">) {
  return `${item.productId}::${item.size ?? ""}`;
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (item: CartItem) => void;
  setQuantity: (productId: string, size: string | null, quantity: number) => void;
  removeItem: (productId: string, size: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const items = useMemo(() => parse(raw), [raw]);
  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const addItem = useCallback((item: CartItem) => {
    const current = parse(getSnapshot());
    const key = itemKey(item);
    const existing = current.find((entry) => itemKey(entry) === key);
    const quantity = Math.min(99, item.quantity);

    if (existing) {
      write(
        current.map((entry) =>
          itemKey(entry) === key
            ? {
                ...entry,
                quantity: Math.min(99, entry.quantity + quantity),
                price: item.price,
                originalPrice: item.originalPrice,
              }
            : entry,
        ),
      );
      return;
    }

    write([...current, { ...item, quantity }]);
  }, []);

  const setQuantity = useCallback(
    (productId: string, size: string | null, quantity: number) => {
      const current = parse(getSnapshot());
      const key = itemKey({ productId, size });

      if (quantity <= 0) {
        write(current.filter((entry) => itemKey(entry) !== key));
        return;
      }

      write(
        current.map((entry) =>
          itemKey(entry) === key
            ? { ...entry, quantity: Math.min(99, quantity) }
            : entry,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback((productId: string, size: string | null) => {
    const key = itemKey({ productId, size });
    write(parse(getSnapshot()).filter((entry) => itemKey(entry) !== key));
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo(
    () => ({ items, count, addItem, setQuantity, removeItem, clear }),
    [items, count, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart muss innerhalb von CartProvider verwendet werden.");
  }

  return context;
}
