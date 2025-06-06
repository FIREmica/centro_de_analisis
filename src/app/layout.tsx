
// "use client"; // This was commented out, which is correct for a Server Component layout.

import type {Metadata} from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers'; 
import { analytics } from '@/lib/firebase/client'; 

const geistSans = Geist({ 
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({ 
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Centro de Análisis de Seguridad Integral',
  description: 'Plataforma integral para analizar la seguridad de aplicaciones web, servidores (incluyendo servidores de juegos), bases de datos y más, identificando vulnerabilidades comunes y específicas con IA.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  return (
    <html lang="es" suppressHydrationWarning> {/* Default to light, ThemeProvider will add dark/blue class */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {paypalClientId && 
         paypalClientId.trim() !== "" && 
         paypalClientId !== "tu_paypal_sandbox_client_id_aqui_para_sdk_js_" && 
         paypalClientId !== "AdLdNIavBkmAj9AyalbF_sDT0pF5l7PH0W6JHfHKl9gl5bIqrHa9cNAunX52IIoMFPtPPgum28S0ZnYr" &&
         (
          <Script
            src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`}
            strategy="beforeInteractive" // Use 'lazyOnload' if it causes issues
            data-sdk-integration-source="developer-studio" 
            // Consider adding onError for this script if problems persist
          />
        )}
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning={true} // Keep this if you still face minor hydration issues after fixing the main one
      >
        <Providers> 
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
