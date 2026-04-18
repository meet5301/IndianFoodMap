import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "ifm_theme";

export const ThemeProvider = ({ children }) => {
  const [theme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem(STORAGE_KEY, "dark");
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: () => {},
      toggleTheme: () => {}
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};
