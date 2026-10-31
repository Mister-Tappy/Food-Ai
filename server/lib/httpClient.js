// =========================================================
// HTTP CLIENT
// Thin wrapper around undici's fetch, used instead of Node's global
// `fetch` for one specific reason: many hosting environments (containers,
// some cloud providers, certain corporate/VPN networks) have broken or
// entirely absent outbound IPv6 routing. If DNS returns an IPv6 (AAAA)
// address for a host and the environment can't actually route IPv6
// traffic, a plain fetch() call hangs until connect-timeout and fails —
// even though IPv4 to the exact same host would have worked instantly.
// ("Connect Timeout Error (attempted address: <host>:443, ...)" is the
// telltale symptom.)
//
// Forcing `family: 4` here means we always attempt IPv4, sidestepping
// that whole class of failure. We use undici's own fetch (not Node's
// built-in one) paired with undici's own Agent, because passing a
// separately-installed undici Agent as a `dispatcher` into Node's
// *built-in* fetch throws (their bundled undici versions don't always
// match) — using undici's fetch + undici's Agent together avoids that.
// =========================================================
const { fetch: undiciFetch, Agent } = require("undici");

const ipv4Agent = new Agent({ connect: { family: 4 } });

/**
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number }} [options]
 */
async function fetchIPv4(url, options = {}) {
  const { timeoutMs = 12000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await undiciFetch(url, { ...rest, dispatcher: ipv4Agent, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Node's fetch reports every network failure as a generic "fetch failed"
// Error — the real reason (DNS failure, ECONNREFUSED, TLS error, a connect
// timeout, an egress-proxy denial, etc.) lives one level down in `err.cause`.
function describeError(err) {
  if (err?.name === "AbortError") return "request timed out";
  if (err?.cause?.message) return err.cause.message;
  if (err?.cause?.code) return err.cause.code;
  return err?.message || String(err);
}

module.exports = { fetchIPv4, describeError };
