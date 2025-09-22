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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-seitige Konfiguration: Ersetze das isomorphic-ws Modul mit einem leeren Modul
      config.resolve.alias['@libsql/isomorphic-ws'] = false;
    }
    return config;
  },
}

module.exports = nextConfig;
