/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  
    // Eliminada la configuración i18n para evitar warnings en App Router
  
    images: {
      domains: ['cdn.paypal.com'],
    },
  };
  
  module.exports = nextConfig;
  