const VISITOR_ID_KEY = "visitorId";
const LIKED_POSTS_KEY = "likedPosts";
const PAGE_VIEW_TIMESTAMPS_KEY = "trackedPageViews";

type JsonRecord = Record<string, number | boolean>;

function getStorage(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readRecord<T extends JsonRecord>(
  storage: Storage | null,
  key: string,
): T {
  if (!storage) {
    return {} as T;
  }

  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return {} as T;
    }

    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

function writeRecord(storage: Storage | null, key: string, value: JsonRecord) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {}
}

function createVisitorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `v_${crypto.randomUUID()}`;
  }

  return `v_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

export function getOrCreateVisitorId(): string {
  const storage = getStorage("local");
  if (!storage) {
    return "anonymous";
  }

  const existing = storage.getItem(VISITOR_ID_KEY);
  if (existing) {
    return existing;
  }

  const visitorId = createVisitorId();
  storage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId;
}

export function getLikedPosts(): Record<string, boolean> {
  return readRecord<Record<string, boolean>>(getStorage("local"), LIKED_POSTS_KEY);
}

export function setLikedPosts(likedPosts: Record<string, boolean>) {
  writeRecord(getStorage("local"), LIKED_POSTS_KEY, likedPosts);
}

export function shouldTrackPageView(path: string, ttlMs = 30 * 60 * 1000) {
  const storage = getStorage("session");
  const trackedViews = readRecord<Record<string, number>>(
    storage,
    PAGE_VIEW_TIMESTAMPS_KEY,
  );
  const now = Date.now();
  const lastTrackedAt = trackedViews[path];

  if (typeof lastTrackedAt === "number" && now - lastTrackedAt < ttlMs) {
    return false;
  }

  trackedViews[path] = now;
  writeRecord(storage, PAGE_VIEW_TIMESTAMPS_KEY, trackedViews);
  return true;
}
