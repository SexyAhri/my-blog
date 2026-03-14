interface CacheItem<T> {
  data: T;
  expireAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  private prefixIndex = new Map<string, Set<string>>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      this.removeFromPrefixIndex(key);
      return null;
    }

    return item.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds = 60): void {
    this.cache.set(key, {
      data,
      expireAt: Date.now() + ttlSeconds * 1000,
    });
    this.addToPrefixIndex(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.removeFromPrefixIndex(key);
  }

  deleteByPrefix(prefix: string): void {
    const keys = this.prefixIndex.get(prefix);
    if (!keys) return;

    for (const key of keys) {
      this.cache.delete(key);
    }

    this.prefixIndex.delete(prefix);
  }

  deletePattern(pattern: string): void {
    const prefixMatch = pattern.match(/^\^([a-zA-Z0-9_-]+:?)$/);
    if (prefixMatch) {
      this.deleteByPrefix(prefixMatch[1]);
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.removeFromPrefixIndex(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.prefixIndex.clear();
  }

  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds = 60,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    return this.dedupe(key, async () => {
      const data = await fn();
      this.set(key, data, ttlSeconds);
      return data;
    });
  }

  private getPrefix(key: string): string | null {
    const idx = key.indexOf(":");
    return idx > 0 ? key.substring(0, idx + 1) : null;
  }

  private addToPrefixIndex(key: string): void {
    const prefix = this.getPrefix(key);
    if (!prefix) return;

    let set = this.prefixIndex.get(prefix);
    if (!set) {
      set = new Set<string>();
      this.prefixIndex.set(prefix, set);
    }

    set.add(key);
  }

  private removeFromPrefixIndex(key: string): void {
    const prefix = this.getPrefix(key);
    if (!prefix) return;

    const set = this.prefixIndex.get(prefix);
    if (!set) return;

    set.delete(key);
    if (set.size === 0) {
      this.prefixIndex.delete(prefix);
    }
  }
}

export const cache = new MemoryCache();

export function invalidatePostCaches(
  slugs: Array<string | null | undefined> = [],
) {
  cache.deletePattern("^posts:");

  for (const slug of slugs) {
    if (slug) {
      cache.delete(`post:${slug}`);
    }
  }
}

export function invalidateTaxonomyCaches() {
  cache.delete("categories:all");
  cache.delete("tags:all");
}

export const CACHE_TTL = {
  SHORT: 30,
  MEDIUM: 60,
  LONG: 300,
  VERY_LONG: 600,
};
