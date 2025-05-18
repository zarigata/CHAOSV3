// ==========================================================
// 🎨 C.H.A.O.S. THEME PROVIDER SYSTEM 🎨
// ==========================================================
// - DARK/LIGHT/SYSTEM THEME MANAGEMENT
// - PERSISTENT THEME PREFERENCES
// - MSN-INSPIRED COLOR SCHEMES
// - CROSS-PLATFORM COMPATIBILITY
// ==========================================================

import { createContext, useContext, useEffect, useState } from "react";

// Define available themes
type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// Create context for theme state
const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  // Initialize theme state from localStorage or default
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to retrieve from localStorage first
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem(storageKey);
      if (storedTheme && (storedTheme === "dark" || storedTheme === "light" || storedTheme === "system")) {
        return storedTheme as Theme;
      }
    }
    return defaultTheme;
  });

  // Update theme in localStorage when it changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Save user preference
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      const root = window.document.documentElement;
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
    };

    // Set initial value
    handleChange();
    
    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);
    
    // Cleanup
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Create memoized context value
  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Custom hook to use the theme context
export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
