import { generateSlug } from "@/lib/utils";

export interface PostMutationRequest {
  title: string;
  slug?: string | null;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  published?: boolean;
  categoryId?: string | null;
  tagIds?: string[] | null;
  tags?: string[] | null;
  seriesId?: string | null;
  seriesOrder?: number | null;
  scheduledAt?: string | null;
}

export interface ParsedPostMutationInput {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  categoryId: string | null;
  tagIds: string[];
  seriesId: string | null;
  seriesOrder: number | null;
  scheduledAt: Date | null;
  isScheduled: boolean;
  shouldPublish: boolean;
}

type ParseSuccess = {
  success: true;
  data: ParsedPostMutationInput;
};

type ParseFailure = {
  success: false;
  error: string;
  status: number;
};

export type PostMutationParseResult = ParseSuccess | ParseFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getOptionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function getNullableTrimmedString(value: unknown): string | null {
  return getOptionalTrimmedString(value) ?? null;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function parsePostMutationInput(
  value: unknown,
): PostMutationParseResult {
  if (!isRecord(value)) {
    return {
      success: false,
      error: "Invalid post payload",
      status: 400,
    };
  }

  const title = getOptionalTrimmedString(value.title);
  if (!title) {
    return {
      success: false,
      error: "Title is required",
      status: 400,
    };
  }

  const content =
    typeof value.content === "string" ? value.content.trim() : undefined;
  if (!content) {
    return {
      success: false,
      error: "Content is required",
      status: 400,
    };
  }

  const slugSource = getOptionalTrimmedString(value.slug) ?? title;
  const slug = generateSlug(slugSource);
  if (!slug) {
    return {
      success: false,
      error: "A valid slug is required",
      status: 400,
    };
  }

  let seriesOrder: number | null = null;
  if (value.seriesOrder !== undefined && value.seriesOrder !== null && value.seriesOrder !== "") {
    const parsedSeriesOrder =
      typeof value.seriesOrder === "number"
        ? value.seriesOrder
        : Number(value.seriesOrder);

    if (!Number.isInteger(parsedSeriesOrder) || parsedSeriesOrder <= 0) {
      return {
        success: false,
        error: "Series order must be a positive integer",
        status: 400,
      };
    }

    seriesOrder = parsedSeriesOrder;
  }

  let scheduledAt: Date | null = null;
  const scheduledAtInput = getOptionalTrimmedString(value.scheduledAt);
  if (scheduledAtInput) {
    const parsedDate = new Date(scheduledAtInput);
    if (Number.isNaN(parsedDate.getTime())) {
      return {
        success: false,
        error: "Scheduled publish time is invalid",
        status: 400,
      };
    }

    scheduledAt = parsedDate;
  }

  const tagIds = getStringArray(value.tagIds ?? value.tags);
  const isScheduled = scheduledAt !== null && scheduledAt > new Date();
  const published = Boolean(value.published);

  return {
    success: true,
    data: {
      title,
      slug,
      content,
      excerpt: getNullableTrimmedString(value.excerpt),
      coverImage: getNullableTrimmedString(value.coverImage),
      published,
      categoryId: getNullableTrimmedString(value.categoryId),
      tagIds,
      seriesId: getNullableTrimmedString(value.seriesId),
      seriesOrder,
      scheduledAt: isScheduled ? scheduledAt : null,
      isScheduled,
      shouldPublish: published && !isScheduled,
    },
  };
}
