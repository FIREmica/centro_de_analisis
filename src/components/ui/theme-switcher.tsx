// src/components/ui/theme-switcher.tsx
"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { name: "Claro", value: "light" },
  { name: "Oscuro", value: "dark" },
  { name: "Azul", value: "blue" },
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (themeValue: string) => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-blue");
    if (themeValue === "dark") root.classList.add("theme-dark");
    else if (themeValue === "blue") root.classList.add("theme-blue");

    localStorage.setItem("theme", themeValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTheme(value);
    applyTheme(value);
  };

  return (
    <div className="text-sm">
      <label htmlFor="theme-select" className="mr-2">Tema:</label>
      <select
        id="theme-select"
        value={theme}
        onChange={handleChange}
        className="px-2 py-1 rounded border border-input bg-background text-foreground"
      >
        {THEMES.map((t) => (
          <option key={t.value} value={t.value}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}
