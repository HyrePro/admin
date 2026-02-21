export function getClientAuthOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_AUTH_ORIGIN?.trim();
  const adminHost = "admin.hyriki.com";
  const adminOrigin = `https://${adminHost}`;

  const normalizeOrigin = (rawOrigin: string) => rawOrigin.replace(/\/+$/, "");

  const toNormalizedOrigin = (rawOrigin: string) => {
    try {
      const parsed = new URL(rawOrigin);
      const hostname = parsed.hostname.toLowerCase();

      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.endsWith(".localhost")
      ) {
        return `${parsed.protocol}//${parsed.host}`;
      }

      // Admin platform must always use admin domain for auth redirects.
      return adminOrigin;
    } catch {
      return adminOrigin;
    }
  };

  if (configuredOrigin && /^https?:\/\//i.test(configuredOrigin)) {
    return toNormalizedOrigin(configuredOrigin);
  }

  return toNormalizedOrigin(window.location.origin);
}
