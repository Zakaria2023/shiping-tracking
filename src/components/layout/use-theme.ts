"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

// The theme lives on <html data-theme>, set before paint by the script in
// app/layout.tsx; this follows that attribute rather than keeping a copy.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};

const getSnapshot = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

// Unknown on the server; the toggle renders neutrally until hydrated.
const getServerSnapshot = (): Theme | null => null;

/** The current theme, and a switch that remembers the choice in this browser. */
export const useTheme = () => {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const next: Theme = getSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (private window): the switch still applies to this page.
    }
  };

  return { theme, toggleTheme };
};
