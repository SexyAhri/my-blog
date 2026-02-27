// 内存缓存，支持前缀快速删除
interface CacheItem<T> {
    data: T;
    expireAt: number;
}

class MemoryCache {
    private cache = new Map<string, CacheItem<any>>();
    private pendingRequests = new Map<string, Promise<any>>();
    // 前缀索引：prefix -> Set<fullKey>，加速 deleteByPrefix
    private prefixIndex = new Map<string, Set<string>>();

    // 获取缓存
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

    // 设置缓存
    set<T>(key: string, data: T, ttlSeconds: number = 60): void {
        this.cache.set(key, {
            data,
            expireAt: Date.now() + ttlSeconds * 1000,
        });
        this.addToPrefixIndex(key);
    }

    // 删除缓存
    delete(key: string): void {
        this.cache.delete(key);
        this.removeFromPrefixIndex(key);
    }

    // 按前缀快速删除（替代正则遍历）
    deleteByPrefix(prefix: string): void {
        const keys = this.prefixIndex.get(prefix);
        if (keys) {
            for (const key of keys) {
                this.cache.delete(key);
            }
            this.prefixIndex.delete(prefix);
        }
    }

    // 兼容旧接口：按正则删除
    deletePattern(pattern: string): void {
        // 优化：如果 pattern 是简单前缀（如 "^posts:"），走前缀索引
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

    // 清空所有缓存
    clear(): void {
        this.cache.clear();
        this.prefixIndex.clear();
    }

    // 防止重复请求
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

    // 带缓存的请求
    async cached<T>(
        key: string,
        fn: () => Promise<T>,
        ttlSeconds: number = 60
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

    // 提取 key 的前缀（第一个 ":" 之前的部分 + ":"）
    private getPrefix(key: string): string | null {
        const idx = key.indexOf(":");
        return idx > 0 ? key.substring(0, idx + 1) : null;
    }

    private addToPrefixIndex(key: string): void {
        const prefix = this.getPrefix(key);
        if (!prefix) return;
        let set = this.prefixIndex.get(prefix);
        if (!set) {
            set = new Set();
            this.prefixIndex.set(prefix, set);
        }
        set.add(key);
    }

    private removeFromPrefixIndex(key: string): void {
        const prefix = this.getPrefix(key);
        if (!prefix) return;
        const set = this.prefixIndex.get(prefix);
        if (set) {
            set.delete(key);
            if (set.size === 0) this.prefixIndex.delete(prefix);
        }
    }
}

// 全局缓存实例
export const cache = new MemoryCache();

// 缓存时间常量
export const CACHE_TTL = {
    SHORT: 30,      // 30秒 - 频繁变化的数据
    MEDIUM: 60,     // 1分钟 - 一般数据
    LONG: 300,      // 5分钟 - 不常变化的数据
    VERY_LONG: 600, // 10分钟 - 几乎不变的数据
};
