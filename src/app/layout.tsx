
// Remove "use client"; directive
// "use client"; 

import type {Metadata} from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
// import { AuthProvider } from '@/context/AuthContext'; // No longer directly used here
import { Providers } from './providers'; // Import the new Providers component
import { analytics } from '@/lib/firebase/client'; // analytics is imported but not used here.

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
    <html lang="es" suppressHydrationWarning className="dark">
      <head>
        {/* 
        // TEMPORARILY COMMENTED OUT FOR DEBUGGING "WEB NO CARGA"
        {paypalClientId && 
         paypalClientId.trim() !== "" && 
         paypalClientId !== "tu_paypal_sandbox_client_id_aqui_para_sdk_js_" && // Original placeholder
         paypalClientId !== "AdLdNIavBkmAj9AyalbF_sDT0pF5l7PH0W6JHfHKl9gl5bIqrHa9cNAunX52IIoMFPtPPgum28S0ZnYr" && // Example placeholder
         (
          <Script
            src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`}
            strategy="beforeInteractive"
            data-sdk-integration-source="developer-studio" 
          />
        )}
        */}
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning={true}
      >
        <Providers> {/* Use the Providers component here */}
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

