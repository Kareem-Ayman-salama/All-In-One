import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem("ain-theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ain-theme", theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme(nextTheme) {
      if (nextTheme === "light" || nextTheme === "dark") setThemeState(nextTheme);
    },
    toggleTheme() {
      setThemeState((current) => current === "dark" ? "light" : "dark");
    }
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
