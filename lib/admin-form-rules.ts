import type { Rule } from "antd/es/form";
import {
  isValidEmail,
  isValidHttpUrl,
  isValidImageSource,
} from "@/lib/admin-validation";
import { generateSlug } from "@/lib/utils";

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function createRequiredTrimmedRule(
  label: string,
  maxLength: number,
): Rule {
  return {
    validator(_, value) {
      const trimmedValue = getTrimmedString(value);

      if (!trimmedValue) {
        return Promise.reject(new Error(`${label} is required`));
      }

      if (trimmedValue.length > maxLength) {
        return Promise.reject(
          new Error(`${label} must be ${maxLength} characters or less`),
        );
      }

      return Promise.resolve();
    },
  };
}

export function createOptionalTrimmedRule(
  label: string,
  maxLength: number,
): Rule {
  return {
    validator(_, value) {
      if (value === undefined || value === null || value === "") {
        return Promise.resolve();
      }

      if (typeof value !== "string") {
        return Promise.reject(new Error(`${label} must be a string`));
      }

      const trimmedValue = value.trim();
      if (!trimmedValue) {
        return Promise.resolve();
      }

      if (trimmedValue.length > maxLength) {
        return Promise.reject(
          new Error(`${label} must be ${maxLength} characters or less`),
        );
      }

      return Promise.resolve();
    },
  };
}

export function createOptionalHttpUrlRule(
  label: string,
  maxLength: number,
): Rule {
  return {
    validator(_, value) {
      if (value === undefined || value === null || value === "") {
        return Promise.resolve();
      }

      if (typeof value !== "string") {
        return Promise.reject(new Error(`${label} must be a string`));
      }

      const trimmedValue = value.trim();
      if (!trimmedValue) {
        return Promise.resolve();
      }

      if (trimmedValue.length > maxLength) {
        return Promise.reject(
          new Error(`${label} must be ${maxLength} characters or less`),
        );
      }

      if (!isValidHttpUrl(trimmedValue)) {
        return Promise.reject(
          new Error(`${label} must be a valid http or https URL`),
        );
      }

      return Promise.resolve();
    },
  };
}

export function createOptionalEmailRule(
  label: string,
  maxLength: number,
): Rule {
  return {
    validator(_, value) {
      if (value === undefined || value === null || value === "") {
        return Promise.resolve();
      }

      if (typeof value !== "string") {
        return Promise.reject(new Error(`${label} must be a string`));
      }

      const trimmedValue = value.trim();
      if (!trimmedValue) {
        return Promise.resolve();
      }

      if (trimmedValue.length > maxLength) {
        return Promise.reject(
          new Error(`${label} must be ${maxLength} characters or less`),
        );
      }

      if (!isValidEmail(trimmedValue)) {
        return Promise.reject(
          new Error(`${label} must be a valid email address`),
        );
      }

      return Promise.resolve();
    },
  };
}

export function createOptionalImageSourceRule(
  label: string,
  maxLength: number,
): Rule {
  return {
    validator(_, value) {
      if (value === undefined || value === null || value === "") {
        return Promise.resolve();
      }

      if (typeof value !== "string") {
        return Promise.reject(new Error(`${label} must be a string`));
      }

      const trimmedValue = value.trim();
      if (!trimmedValue) {
        return Promise.resolve();
      }

      if (!isValidImageSource(trimmedValue)) {
        return Promise.reject(
          new Error(
            `${label} must be a root-relative path or a valid http or https URL`,
          ),
        );
      }

      if (trimmedValue.length > maxLength) {
        return Promise.reject(
          new Error(`${label} must be ${maxLength} characters or less`),
        );
      }

      return Promise.resolve();
    },
  };
}

export function createIntegerRangeRule(
  label: string,
  min: number,
  max: number,
): Rule {
  return {
    validator(_, value) {
      if (value === undefined || value === null || value === "") {
        return Promise.reject(new Error(`${label} is required`));
      }

      const rawValue =
        typeof value === "number"
          ? String(value)
          : typeof value === "string"
            ? value.trim()
            : "";

      if (!rawValue) {
        return Promise.reject(new Error(`${label} is required`));
      }

      const parsedValue = Number(rawValue);
      if (!Number.isInteger(parsedValue)) {
        return Promise.reject(new Error(`${label} must be an integer`));
      }

      if (parsedValue < min || parsedValue > max) {
        return Promise.reject(
          new Error(`${label} must be between ${min} and ${max}`),
        );
      }

      return Promise.resolve();
    },
  };
}

export function createKeywordsRule(maxLength: number): Rule {
  return {
    validator(_, value) {
      if (value === undefined || value === null || value === "") {
        return Promise.resolve();
      }

      if (typeof value !== "string") {
        return Promise.reject(new Error("Keywords must be a string"));
      }

      const normalized = normalizeKeywords(value);
      if (normalized.length > maxLength) {
        return Promise.reject(
          new Error(`Keywords must be ${maxLength} characters or less`),
        );
      }

      return Promise.resolve();
    },
  };
}

export function createSlugRule(label = "Slug"): Rule {
  return {
    validator(_, value) {
      const trimmedValue = getTrimmedString(value);

      if (!trimmedValue) {
        return Promise.reject(new Error(`${label} is required`));
      }

      if (!generateSlug(trimmedValue)) {
        return Promise.reject(
          new Error(`A valid ${label.toLowerCase()} is required`),
        );
      }

      return Promise.resolve();
    },
  };
}

export function normalizeKeywords(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).join(", ");
}

export function normalizeSlugValue(value: string) {
  return generateSlug(value.trim());
}
