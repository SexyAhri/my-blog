/**
 * 简单内存限流 - 保护 API 接口
 * 生产环境建议使用 Redis 等持久化方案
 */

const store = new Map<string, { count: number; resetAt: number }>();

// 清理过期记录
function cleanup() {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
        if (value.resetAt < now) store.delete(key);
    }
}
// 每分钟清理一次
const timer = setInterval(cleanup, 60000);
// 不阻止进程优雅退出
if (typeof timer.unref === "function") timer.unref();

export interface RateLimitOptions {
    /** 时间窗口（秒） */
    window: number;
    /** 窗口内最大请求数 */
    max: number;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * 检查是否超过限流
 * @param key 限流键（如 IP、userId）
 * @param options 限流配置
 */
export function rateLimit(
    key: string,
    options: RateLimitOptions
): RateLimitResult {
    const now = Date.now();
    const windowMs = options.window * 1000;
    const record = store.get(key);

    if (!record) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return { success: true, remaining: options.max - 1, resetAt };
    }

    if (now > record.resetAt) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return { success: true, remaining: options.max - 1, resetAt };
    }

    record.count++;
    const remaining = Math.max(0, options.max - record.count);
    const success = record.count <= options.max;

    return {
        success,
        remaining,
        resetAt: record.resetAt,
    };
}

/** 获取客户端 IP */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    if (forwarded) return forwarded.split(",")[0].trim();
    if (realIp) return realIp;
    return "unknown";
}
