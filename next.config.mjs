// Content-Security-Policy, shipped in REPORT-ONLY mode: browsers log
// violations to the console but block nothing. Switch the header key to
// "Content-Security-Policy" only after the report-only run is clean in
// production. 'unsafe-inline' scripts are needed because statically rendered
// Next.js pages use inline bootstrap scripts (nonces require dynamic rendering).
const gaEnabled = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${gaEnabled ? " https://www.googletagmanager.com" : ""}`,
  // Google Fonts CSS/files: handwriting fonts in the signature tools
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  // fetch() of data:/blob: URLs is used to turn canvases into bytes
  `connect-src 'self' data: blob:${gaEnabled ? " https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com" : ""}`,
  // pdf.js worker is loaded from unpkg (see src/lib/pdf/pdfjs.ts)
  "worker-src 'self' blob: https://unpkg.com",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-label",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
    ],
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/og-image.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    if (!isServer && config.optimization?.splitChunks) {
      const existing = config.optimization.splitChunks.cacheGroups || {};
      config.optimization.splitChunks.cacheGroups = {
        ...existing,
        pdfjs: {
          name: "pdfjs",
          test: /[\\/]node_modules[\\/](pdfjs-dist)[\\/]/,
          chunks: "async",
          priority: 30,
          reuseExistingChunk: true,
        },
        pdflib: {
          name: "pdflib",
          test: /[\\/]node_modules[\\/](pdf-lib|@pdf-lib)[\\/]/,
          chunks: "async",
          priority: 30,
          reuseExistingChunk: true,
        },
      };
    }

    return config;
  },
};

export default nextConfig;
