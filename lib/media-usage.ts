import { existsSync } from "fs";
import { readdir, stat } from "fs/promises";
import { relative, resolve, sep } from "path";
import { prisma } from "@/lib/prisma";

const SINGLE_UPLOAD_PATH_PATTERN =
  /\/uploads\/[^"'<>\\s?#]+(?:\?[^"'<>\\s#]*)?(?:#[^"'<>\\s]*)?/i;
const GLOBAL_UPLOAD_PATH_PATTERN =
  /\/uploads\/[^"'<>\\s?#]+(?:\?[^"'<>\\s#]*)?(?:#[^"'<>\\s]*)?/gi;

const SETTING_LABELS: Record<string, string> = {
  siteAvatar: "Site avatar",
  siteProfileBanner: "Site profile banner",
};

export type MediaUsageReferenceKind =
  | "post-cover"
  | "post-content"
  | "series-cover"
  | "setting"
  | "user-image";

export interface MediaUsageReference {
  kind: MediaUsageReferenceKind;
  label: string;
  targetId: string;
  targetName: string;
}

export interface MediaUsageSummary {
  count: number;
  isUsed: boolean;
  references: MediaUsageReference[];
}

export interface MediaStorageSummary {
  existsInStorage: boolean;
  status: "available" | "missing";
}

export interface StoredUploadFileInfo {
  filename: string;
  filepath: string;
  size: number;
  updatedAt: string;
}

export interface OrphanedUploadFile extends StoredUploadFileInfo {
  usage: MediaUsageSummary;
}

export interface BrokenMediaReference {
  filepath: string;
  usage: MediaUsageSummary;
}

export interface MediaLibraryAudit {
  usageMap: Record<string, MediaUsageSummary>;
  storageMap: Record<string, MediaStorageSummary>;
  orphanedFiles: OrphanedUploadFile[];
  brokenReferences: BrokenMediaReference[];
}

export function createEmptyMediaUsageSummary(): MediaUsageSummary {
  return {
    count: 0,
    isUsed: false,
    references: [],
  };
}

export function normalizeMediaPath(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(SINGLE_UPLOAD_PATH_PATTERN);
  if (!match) {
    return null;
  }

  return stripQueryAndHash(match[0]);
}

export function extractMediaPaths(content: string) {
  const matches = content.match(GLOBAL_UPLOAD_PATH_PATTERN) ?? [];
  return Array.from(
    new Set(
      matches
        .map((value) => normalizeMediaPath(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

export function resolveUploadFilepath(filepath: string) {
  const normalizedPath = normalizeMediaPath(filepath);
  if (!normalizedPath) {
    return null;
  }

  const uploadsRoot = getUploadsRoot();
  const absolutePath = resolve(
    uploadsRoot,
    normalizedPath.replace(/^\/+uploads\/?/, ""),
  );
  const isInUploadsDir =
    absolutePath === uploadsRoot ||
    absolutePath.startsWith(`${uploadsRoot}${sep}`);

  return isInUploadsDir ? absolutePath : null;
}

export async function listStoredUploadFiles() {
  const uploadsRoot = getUploadsRoot();
  if (!existsSync(uploadsRoot)) {
    return [];
  }

  const files = await walkUploadDirectory(uploadsRoot, uploadsRoot);
  return files.sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export async function getMediaUsageMap(filepaths?: string[]) {
  const normalizedPaths = Array.from(
    new Set(
      (filepaths ?? [])
        .map((value) => normalizeMediaPath(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const pathFilter = normalizedPaths.length > 0 ? new Set(normalizedPaths) : null;
  const referencesByPath = new Map<string, MediaUsageReference[]>();

  const [posts, series, settings, users] = await Promise.all([
    prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        content: true,
      },
    }),
    prisma.series.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        coverImage: true,
      },
    }),
    prisma.setting.findMany({
      where: { key: { in: Object.keys(SETTING_LABELS) } },
      select: {
        key: true,
        value: true,
      },
    }),
    prisma.user.findMany({
      where: {
        image: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    }),
  ]);

  const pushReference = (
    filepath: string | null,
    reference: MediaUsageReference,
  ) => {
    if (!filepath) {
      return;
    }

    if (pathFilter && !pathFilter.has(filepath)) {
      return;
    }

    const current = referencesByPath.get(filepath) ?? [];
    const alreadyIncluded = current.some(
      (item) =>
        item.kind === reference.kind &&
        item.targetId === reference.targetId &&
        item.label === reference.label,
    );

    if (!alreadyIncluded) {
      current.push(reference);
      referencesByPath.set(filepath, current);
    }
  };

  for (const post of posts) {
    pushReference(normalizeMediaPath(post.coverImage), {
      kind: "post-cover",
      label: "Post cover",
      targetId: post.id,
      targetName: post.title || post.slug,
    });

    for (const path of extractMediaPaths(post.content)) {
      pushReference(path, {
        kind: "post-content",
        label: "Post content",
        targetId: post.id,
        targetName: post.title || post.slug,
      });
    }
  }

  for (const item of series) {
    pushReference(normalizeMediaPath(item.coverImage), {
      kind: "series-cover",
      label: "Series cover",
      targetId: item.id,
      targetName: item.name || item.slug,
    });
  }

  for (const setting of settings) {
    pushReference(normalizeMediaPath(setting.value), {
      kind: "setting",
      label: "Site setting",
      targetId: setting.key,
      targetName: SETTING_LABELS[setting.key] ?? setting.key,
    });
  }

  for (const user of users) {
    pushReference(normalizeMediaPath(user.image), {
      kind: "user-image",
      label: "Admin avatar",
      targetId: user.id,
      targetName: user.name || user.email,
    });
  }

  const usageMap: Record<string, MediaUsageSummary> = {};
  const keys = pathFilter ? normalizedPaths : Array.from(referencesByPath.keys());

  for (const filepath of keys) {
    const references = referencesByPath.get(filepath) ?? [];
    usageMap[filepath] = {
      count: references.length,
      isUsed: references.length > 0,
      references,
    };
  }

  return usageMap;
}

export async function getMediaLibraryAudit(mediaFilepaths: string[]) {
  const normalizedMediaFilepaths = Array.from(
    new Set(
      mediaFilepaths
        .map((filepath) => normalizeMediaPath(filepath))
        .filter((filepath): filepath is string => Boolean(filepath)),
    ),
  );

  const [usageMap, storedFiles] = await Promise.all([
    getMediaUsageMap(),
    listStoredUploadFiles(),
  ]);

  const trackedFilepaths = new Set(normalizedMediaFilepaths);
  const storedFilepaths = new Set(storedFiles.map((file) => file.filepath));
  const storageMap: Record<string, MediaStorageSummary> = {};

  for (const filepath of normalizedMediaFilepaths) {
    const existsInStorage = storedFilepaths.has(filepath);
    storageMap[filepath] = {
      existsInStorage,
      status: existsInStorage ? "available" : "missing",
    };
  }

  const orphanedFiles = storedFiles
    .filter((file) => !trackedFilepaths.has(file.filepath))
    .map((file) => ({
      ...file,
      usage: usageMap[file.filepath] ?? createEmptyMediaUsageSummary(),
    }));

  const brokenReferences = Object.entries(usageMap)
    .filter(
      ([filepath, usage]) =>
        usage.isUsed &&
        !trackedFilepaths.has(filepath) &&
        !storedFilepaths.has(filepath),
    )
    .map(([filepath, usage]) => ({
      filepath,
      usage,
    }));

  return {
    usageMap,
    storageMap,
    orphanedFiles,
    brokenReferences,
  } satisfies MediaLibraryAudit;
}

function getUploadsRoot() {
  return resolve(process.cwd(), "public", "uploads");
}

function stripQueryAndHash(value: string) {
  return value.split(/[?#]/, 1)[0] ?? value;
}

async function walkUploadDirectory(
  currentDirectory: string,
  uploadsRoot: string,
): Promise<StoredUploadFileInfo[]> {
  const entries = await readdir(currentDirectory, { withFileTypes: true });
  const files: StoredUploadFileInfo[] = [];

  for (const entry of entries) {
    const absolutePath = resolve(currentDirectory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkUploadDirectory(absolutePath, uploadsRoot)));
      continue;
    }

    if (!entry.isFile() || entry.name === ".gitkeep") {
      continue;
    }

    const fileStat = await stat(absolutePath);
    const relativePath = relative(uploadsRoot, absolutePath).split(sep).join("/");

    files.push({
      filename: entry.name,
      filepath: `/uploads/${relativePath}`,
      size: fileStat.size,
      updatedAt: fileStat.mtime.toISOString(),
    });
  }

  return files;
}
