"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./use-theme";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === null ? undefined : isDark}
      className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm text-muted transition-colors hover:bg-hover hover:text-ink"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
};
