import { generateSlug } from "@/lib/utils";
import {
  POSTS_PER_PAGE_RANGE,
  PROFILE_LIMITS,
  SERIES_LIMITS,
  SETTINGS_LIMITS,
  isValidEmail,
  isValidHttpUrl,
  isValidImageSource,
} from "@/lib/admin-validation";

type ParseSuccess<T> = {
  success: true;
  data: T;
};

type ParseFailure = {
  success: false;
  error: string;
  status: number;
};

type ParseResult<T> = ParseSuccess<T> | ParseFailure;

const SETTINGS_KEYS = [
  "siteName",
  "siteDescription",
  "siteKeywords",
  "siteUrl",
  "siteAuthor",
  "siteEmail",
  "siteIcp",
  "siteAnalytics",
  "postsPerPage",
  "enableComments",
  "enableRss",
  "enableSitemap",
  "socialGithub",
  "socialTwitter",
  "socialWeibo",
  "socialEmail",
  "siteProfileBanner",
  "siteMotto",
  "siteAvatar",
] as const;

type SettingKey = (typeof SETTINGS_KEYS)[number];

export interface ParsedSettingsUpdateInput {
  values: Partial<Record<SettingKey, string>>;
}

export interface ParsedProfileUpdateInput {
  name?: string;
  image?: string | null;
  currentPassword?: string;
  newPassword?: string;
  hasProfileUpdate: boolean;
  hasPasswordUpdate: boolean;
}

export interface ParsedSeriesMutationInput {
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
}

export function parseSettingsUpdateInput(
  value: unknown,
): ParseResult<ParsedSettingsUpdateInput> {
  if (!isRecord(value)) {
    return failure("Invalid settings payload");
  }

  const invalidKeys = Object.keys(value).filter(
    (key) => !SETTINGS_KEYS.includes(key as SettingKey),
  );
  if (invalidKeys.length > 0) {
    return failure(`Unsupported settings: ${invalidKeys.join(", ")}`);
  }

  const values: Partial<Record<SettingKey, string>> = {};

  for (const key of SETTINGS_KEYS) {
    if (!hasOwn(value, key)) {
      continue;
    }

    switch (key) {
      case "siteName": {
        const result = parseRequiredString(
          value[key],
          "Site name",
          SETTINGS_LIMITS.siteName,
        );
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
      case "siteDescription": {
        const result = parseRequiredString(
          value[key],
          "Site description",
          SETTINGS_LIMITS.siteDescription,
        );
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
      case "siteKeywords": {
        const result = parseKeywords(value[key]);
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
      case "siteUrl":
      case "socialGithub":
      case "socialTwitter":
      case "socialWeibo": {
        const label = getSettingLabel(key);
        const result = parseOptionalHttpUrl(
          value[key],
          label,
          key === "siteUrl"
            ? SETTINGS_LIMITS.siteUrl
            : key === "socialGithub"
              ? SETTINGS_LIMITS.socialGithub
              : key === "socialTwitter"
                ? SETTINGS_LIMITS.socialTwitter
                : SETTINGS_LIMITS.socialWeibo,
        );
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
      case "siteEmail":
      case "socialEmail": {
        const label = getSettingLabel(key);
        const result = parseOptionalEmail(
          value[key],
          label,
          key === "siteEmail"
            ? SETTINGS_LIMITS.siteEmail
            : SETTINGS_LIMITS.socialEmail,
        );
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
      case "siteProfileBanner":
      case "siteAvatar": {
        const label = getSettingLabel(key);
        const result = parseOptionalImageSource(value[key], label);
        if (!result.success) {
          return result;
        }

        values[key] = result.data ?? "";
        break;
      }
      case "siteAuthor": {
        const result = parseOptionalTrimmedString(
          value[key],
          "Author",
          SETTINGS_LIMITS.siteAuthor,
        );
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
      case "siteIcp": {
        const result = parseOptionalTrimmedString(
          value[key],
          "ICP record",
          SETTINGS_LIMITS.siteIcp,
        );
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
      case "siteAnalytics": {
        const result = parseOptionalTrimmedString(
          value[key],
          "Analytics code",
          SETTINGS_LIMITS.siteAnalytics,
        );
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
      case "siteMotto": {
        const result = parseOptionalTrimmedString(
          value[key],
          "Profile motto",
          SETTINGS_LIMITS.siteMotto,
        );
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
      case "postsPerPage": {
        const result = parseIntegerString(
          value[key],
          "Posts per page",
          POSTS_PER_PAGE_RANGE.min,
          POSTS_PER_PAGE_RANGE.max,
        );
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
      case "enableComments":
      case "enableRss":
      case "enableSitemap": {
        const result = parseBooleanString(value[key], getSettingLabel(key));
        if (!result.success) {
          return result;
        }

        values[key] = result.data;
        break;
      }
    }
  }

  return success({ values });
}

export function parseProfileUpdateInput(
  value: unknown,
): ParseResult<ParsedProfileUpdateInput> {
  if (!isRecord(value)) {
    return failure("Invalid profile payload");
  }

  const allowedKeys = ["name", "image", "currentPassword", "newPassword"];
  const invalidKeys = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (invalidKeys.length > 0) {
    return failure(`Unsupported profile fields: ${invalidKeys.join(", ")}`);
  }

  const parsed: ParsedProfileUpdateInput = {
    hasProfileUpdate: false,
    hasPasswordUpdate: false,
  };

  if (hasOwn(value, "name")) {
    const result = parseRequiredString(
      value.name,
      "Display name",
      PROFILE_LIMITS.name,
    );
    if (!result.success) {
      return result;
    }

    parsed.name = result.data;
    parsed.hasProfileUpdate = true;
  }

  if (hasOwn(value, "image")) {
    const result = parseOptionalImageSource(value.image, "Avatar");
    if (!result.success) {
      return result;
    }

    parsed.image = result.data;
    parsed.hasProfileUpdate = true;
  }

  const hasCurrentPassword = hasOwn(value, "currentPassword");
  const hasNewPassword = hasOwn(value, "newPassword");

  if (hasCurrentPassword && !hasNewPassword) {
    return failure("New password is required");
  }

  if (!hasCurrentPassword && hasNewPassword) {
    return failure("Current password is required");
  }

  if (hasCurrentPassword && hasNewPassword) {
    const currentPassword =
      typeof value.currentPassword === "string" ? value.currentPassword : "";
    const newPassword =
      typeof value.newPassword === "string" ? value.newPassword : "";

    if (!currentPassword) {
      return failure("Current password is required");
    }

    if (!newPassword) {
      return failure("New password is required");
    }

    if (newPassword.length < PROFILE_LIMITS.passwordMin) {
      return failure("New password must be at least 6 characters");
    }

    if (newPassword.length > PROFILE_LIMITS.passwordMax) {
      return failure("New password must be 128 characters or less");
    }

    parsed.currentPassword = currentPassword;
    parsed.newPassword = newPassword;
    parsed.hasPasswordUpdate = true;
  }

  if (!parsed.hasProfileUpdate && !parsed.hasPasswordUpdate) {
    return failure("No profile changes provided");
  }

  return success(parsed);
}

export function parseSeriesMutationInput(
  value: unknown,
): ParseResult<ParsedSeriesMutationInput> {
  if (!isRecord(value)) {
    return failure("Invalid series payload");
  }

  const allowedKeys = ["name", "slug", "description", "coverImage"];
  const invalidKeys = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (invalidKeys.length > 0) {
    return failure(`Unsupported series fields: ${invalidKeys.join(", ")}`);
  }

  const nameResult = parseRequiredString(
    value.name,
    "Series name",
    SERIES_LIMITS.name,
  );
  if (!nameResult.success) {
    return nameResult;
  }

  const slugSource =
    getOptionalTrimmedString(value.slug) ?? nameResult.data;
  const slug = generateSlug(slugSource);
  if (!slug) {
    return failure("A valid series slug is required");
  }

  const descriptionResult = parseOptionalTrimmedString(
    value.description,
    "Series description",
    SERIES_LIMITS.description,
  );
  if (!descriptionResult.success) {
    return descriptionResult;
  }

  const coverImageResult = parseOptionalImageSource(
    value.coverImage,
    "Series cover image",
  );
  if (!coverImageResult.success) {
    return coverImageResult;
  }

  return success({
    name: nameResult.data,
    slug,
    description: descriptionResult.data || null,
    coverImage: coverImageResult.data,
  });
}

function success<T>(data: T): ParseSuccess<T> {
  return {
    success: true,
    data,
  };
}

function failure(error: string, status = 400): ParseFailure {
  return {
    success: false,
    error,
    status,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasOwn(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function getOptionalTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function parseRequiredString(
  value: unknown,
  label: string,
  maxLength: number,
): ParseResult<string> {
  const parsed = getOptionalTrimmedString(value);
  if (!parsed) {
    return failure(`${label} is required`);
  }

  if (parsed.length > maxLength) {
    return failure(`${label} must be ${maxLength} characters or less`);
  }

  return success(parsed);
}

function parseOptionalTrimmedString(
  value: unknown,
  label: string,
  maxLength: number,
): ParseResult<string> {
  if (value === undefined || value === null || value === "") {
    return success("");
  }

  if (typeof value !== "string") {
    return failure(`${label} must be a string`);
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return success("");
  }

  if (trimmedValue.length > maxLength) {
    return failure(`${label} must be ${maxLength} characters or less`);
  }

  return success(trimmedValue);
}

function parseIntegerString(
  value: unknown,
  label: string,
  min: number,
  max: number,
): ParseResult<string> {
  const rawValue =
    typeof value === "number"
      ? String(value)
      : typeof value === "string"
        ? value.trim()
        : "";

  if (!rawValue) {
    return failure(`${label} is required`);
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed)) {
    return failure(`${label} must be an integer`);
  }

  if (parsed < min || parsed > max) {
    return failure(`${label} must be between ${min} and ${max}`);
  }

  return success(String(parsed));
}

function parseBooleanString(value: unknown, label: string): ParseResult<string> {
  if (typeof value === "boolean") {
    return success(value ? "true" : "false");
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "false") {
      return success(normalized);
    }
  }

  return failure(`${label} must be true or false`);
}

function parseKeywords(value: unknown): ParseResult<string> {
  if (value === undefined || value === null || value === "") {
    return success("");
  }

  if (typeof value !== "string") {
    return failure("Keywords must be a string");
  }

  const normalized = Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).join(", ");

  if (normalized.length > SETTINGS_LIMITS.siteKeywords) {
    return failure(
      `Keywords must be ${SETTINGS_LIMITS.siteKeywords} characters or less`,
    );
  }

  return success(normalized);
}

function parseOptionalHttpUrl(
  value: unknown,
  label: string,
  maxLength: number,
): ParseResult<string> {
  const stringResult = parseOptionalTrimmedString(value, label, maxLength);
  if (!stringResult.success) {
    return stringResult;
  }

  if (!stringResult.data) {
    return success("");
  }

  if (!isValidHttpUrl(stringResult.data)) {
    return failure(`${label} must be a valid http or https URL`);
  }

  return success(stringResult.data);
}

function parseOptionalEmail(
  value: unknown,
  label: string,
  maxLength: number,
): ParseResult<string> {
  const stringResult = parseOptionalTrimmedString(value, label, maxLength);
  if (!stringResult.success) {
    return stringResult;
  }

  if (!stringResult.data) {
    return success("");
  }

  if (!isValidEmail(stringResult.data)) {
    return failure(`${label} must be a valid email address`);
  }

  return success(stringResult.data);
}

function parseOptionalImageSource(
  value: unknown,
  label: string,
): ParseResult<string | null> {
  if (value === undefined || value === null || value === "") {
    return success(null);
  }

  if (typeof value !== "string") {
    return failure(`${label} must be a string`);
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return success(null);
  }

  if (!isValidImageSource(trimmedValue)) {
    return failure(
      `${label} must be a root-relative path or a valid http or https URL`,
    );
  }

  if (trimmedValue.length > SETTINGS_LIMITS.siteAvatar) {
    return failure(
      `${label} must be ${SETTINGS_LIMITS.siteAvatar} characters or less`,
    );
  }

  return success(trimmedValue);
}

function getSettingLabel(key: SettingKey) {
  switch (key) {
    case "siteName":
      return "Site name";
    case "siteDescription":
      return "Site description";
    case "siteKeywords":
      return "Keywords";
    case "siteUrl":
      return "Site URL";
    case "siteAuthor":
      return "Author";
    case "siteEmail":
      return "Contact email";
    case "siteIcp":
      return "ICP record";
    case "siteAnalytics":
      return "Analytics code";
    case "postsPerPage":
      return "Posts per page";
    case "enableComments":
      return "Enable comments";
    case "enableRss":
      return "Enable RSS";
    case "enableSitemap":
      return "Enable sitemap";
    case "socialGithub":
      return "GitHub URL";
    case "socialTwitter":
      return "Twitter URL";
    case "socialWeibo":
      return "Weibo URL";
    case "socialEmail":
      return "Public email";
    case "siteProfileBanner":
      return "Profile banner";
    case "siteMotto":
      return "Profile motto";
    case "siteAvatar":
      return "Avatar";
  }
}
