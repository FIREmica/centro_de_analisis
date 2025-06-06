
"use client"; 

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext"; // New import

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider> {/* Wrap with ThemeProvider */}
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
