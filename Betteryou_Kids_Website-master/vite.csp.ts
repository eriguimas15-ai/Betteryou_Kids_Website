import type { Plugin } from "vite";

/**
 * CSP do frontend Betteryou Kids.
 *
 * - Desenvolvimento: Report-Only (não bloqueia HMR / Vite).
 * - Produção (build): Content-Security-Policy em enforce.
 *
 * Ajustar connect-src/img-src se a API estiver noutro domínio
 * (VITE_API_URL). Maps embed → frame-src google.com.
 */
export const CSP_REPORT_ONLY =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob: https: http://localhost:3001 http://127.0.0.1:3001; " +
  "font-src 'self' data:; " +
  "connect-src 'self' ws: wss: http://localhost:3001 http://127.0.0.1:3001 https:; " +
  "media-src 'self' blob:; " +
  "frame-src 'self' https://www.google.com https://maps.google.com; " +
  "frame-ancestors 'self'; " +
  "base-uri 'self'; " +
  "form-action 'self'";

/** Enforce seguro para assets Vite empacotados (sem inline scripts). */
export const CSP_ENFORCE =
  "default-src 'self'; " +
  "script-src 'self'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob: https: http://localhost:3001 http://127.0.0.1:3001; " +
  "font-src 'self' data:; " +
  "connect-src 'self' http://localhost:3001 http://127.0.0.1:3001 https:; " +
  "media-src 'self' blob:; " +
  "frame-src 'self' https://www.google.com https://maps.google.com; " +
  "frame-ancestors 'self'; " +
  "base-uri 'self'; " +
  "form-action 'self'";

const META_RE =
  /<meta\s+http-equiv=["']Content-Security-Policy(?:-Report-Only)?["'][^>]*>/i;

function cspMeta(enforce: boolean, policy: string): string {
  const httpEquiv = enforce
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";
  const note = enforce
    ? "CSP enforce (produção). Ver docs/OPERACAO-PLATAFORMA.md."
    : "CSP Report-Only (dev / Vite HMR).";
  return `<!-- ${note} -->\n    <meta http-equiv="${httpEquiv}" content="${policy}" />`;
}

/**
 * Plugin Vite: Report-Only em `serve`, enforce em `build`.
 */
export function betteryouCspPlugin(): Plugin {
  let command: "build" | "serve" = "serve";
  return {
    name: "betteryou-csp",
    configResolved(config) {
      command = config.command;
    },
    transformIndexHtml(html) {
      const enforce = command === "build";
      const policy = enforce ? CSP_ENFORCE : CSP_REPORT_ONLY;
      const tag = cspMeta(enforce, policy);
      if (META_RE.test(html)) {
        return html.replace(META_RE, tag);
      }
      return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
    },
  };
}
