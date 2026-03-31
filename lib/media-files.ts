const IMAGE_RULES = {
  jpg: {
    label: "JPG",
    mimeTypes: ["image/jpeg", "image/jpg"],
  },
  jpeg: {
    label: "JPEG",
    mimeTypes: ["image/jpeg", "image/jpg"],
  },
  png: {
    label: "PNG",
    mimeTypes: ["image/png"],
  },
  gif: {
    label: "GIF",
    mimeTypes: ["image/gif"],
  },
  webp: {
    label: "WEBP",
    mimeTypes: ["image/webp"],
  },
} as const;

export const MAX_MEDIA_FILE_SIZE = 5 * 1024 * 1024;
export const SUPPORTED_MEDIA_EXTENSIONS = Object.keys(IMAGE_RULES);
export const SUPPORTED_MEDIA_MIME_TYPES = Array.from(
  new Set(
    Object.values(IMAGE_RULES).flatMap((rule) => rule.mimeTypes),
  ),
);

export interface ValidatedImageFile {
  extension: string;
}

export type ImageValidationResult =
  | {
      ok: true;
      data: ValidatedImageFile;
    }
  | {
      ok: false;
      error: string;
    };

export function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function validateImageFile(
  file: File,
  options?: {
    expectedExtension?: string | null;
  },
): ImageValidationResult {
  const extension = getFileExtension(file.name);
  const extensionRule = IMAGE_RULES[extension as keyof typeof IMAGE_RULES];

  if (!extensionRule) {
    return {
      ok: false,
      error: "Unsupported file extension",
    };
  }

  if (!SUPPORTED_MEDIA_MIME_TYPES.some((mimeType) => mimeType === file.type)) {
    return {
      ok: false,
      error: "Unsupported file type",
    };
  }

  if (!extensionRule.mimeTypes.some((mimeType) => mimeType === file.type)) {
    return {
      ok: false,
      error: "File extension and content type do not match",
    };
  }

  if (file.size > MAX_MEDIA_FILE_SIZE) {
    return {
      ok: false,
      error: "File size must be 5MB or less",
    };
  }

  const expectedExtension = options?.expectedExtension?.toLowerCase() ?? null;
  if (expectedExtension) {
    const expectedRule =
      IMAGE_RULES[expectedExtension as keyof typeof IMAGE_RULES];

    if (!expectedRule) {
      return {
        ok: false,
        error: "Current media URL uses an unsupported extension",
      };
    }

    if (!expectedRule.mimeTypes.some((mimeType) => mimeType === file.type)) {
      return {
        ok: false,
        error: `Replacement file must stay ${expectedRule.label} compatible to preserve the current URL`,
      };
    }
  }

  return {
    ok: true,
    data: {
      extension,
    },
  };
}
