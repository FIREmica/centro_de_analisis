'use client';

<<<<<<< HEAD
import { ThemeProvider } from 'next-themes';
=======
"use client";

import { ThemeProvider as CustomThemeProvider } from '@/context/ThemeContext';
>>>>>>> a70ea8f (a)
import { AuthProvider } from '@/context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
<<<<<<< HEAD
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
=======
    <CustomThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </CustomThemeProvider>
>>>>>>> a70ea8f (a)
  );
}
