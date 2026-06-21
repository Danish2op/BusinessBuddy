import { z } from "zod";

import type { ServiceResult } from "@/lib/agents/types";
import { serviceFailure, serviceSuccess } from "@/lib/agents/types";

function findBalancedJson(value: string): string | undefined {
  const start = value.search(/[\[{]/);
  if (start < 0) {
    return undefined;
  }

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const character = value[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") {
      inString = true;
      continue;
    }

    if (character === "{" || character === "[") {
      stack.push(character === "{" ? "}" : "]");
      continue;
    }

    if (character === "}" || character === "]") {
      if (stack.pop() !== character) {
        return undefined;
      }

      if (stack.length === 0) {
        return value.slice(start, index + 1).trim();
      }
    }
  }

  return undefined;
}

export function stripJsonFences(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const embeddedFence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fenced) {
    return fenced[1].trim();
  }

  if (embeddedFence) {
    return embeddedFence[1].trim();
  }

  return findBalancedJson(trimmed) ?? trimmed;
}

export function parseJsonStrict<T = unknown>(value: string): ServiceResult<T> {
  try {
    return serviceSuccess(JSON.parse(stripJsonFences(value)) as T);
  } catch {
    return serviceFailure({
      code: "invalid_json",
      message: "Model response was not valid JSON."
    });
  }
}

export function parseJsonWithSchema<TSchema extends z.ZodTypeAny>(
  value: string,
  schema: TSchema
): ServiceResult<z.infer<TSchema>> {
  const parsed = parseJsonStrict<unknown>(value);
  if (!parsed.ok) {
    return parsed;
  }

  const validated = schema.safeParse(parsed.data);
  if (!validated.success) {
    return serviceFailure({
      code: "schema_validation_failed",
      message: validated.error.issues.map((issue) => issue.message).join("; ")
    });
  }

  return serviceSuccess(validated.data);
}
