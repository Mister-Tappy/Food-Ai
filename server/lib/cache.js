// =========================================================
// TTL CACHE
// Tiny in-memory cache used to satisfy PROJECT REQUIREMENT #8
// (Performance): cache Place Details, avoid duplicate concurrent
// requests for the same key, and expire stale entries.
//
// Not a distributed cache — fine for a single Render instance / demo.
// Swap for Redis if the API ever runs multi-instance.
// =========================================================
class TTLCache {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.store = new Map(); // key -> { value, expiresAt }
    this.inFlight = new Map(); // key -> Promise (dedupe concurrent misses)
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMsOverride) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMsOverride ?? this.ttlMs),
    });
  }

  /**
   * Returns the cached value if present; otherwise calls `loader()` once
   * even if multiple requests for the same key arrive concurrently
   * (in-flight de-duplication), caches the result, and returns it.
   */
  async getOrLoad(key, loader) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const promise = (async () => {
      try {
        const value = await loader();
        this.set(key, value);
        return value;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }
}

module.exports = { TTLCache };
