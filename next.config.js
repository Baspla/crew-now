/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Warnungen ignorieren, aber den Build fortsetzen
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript-Fehler ignorieren, aber den Build fortsetzen
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig;
