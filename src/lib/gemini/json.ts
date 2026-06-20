import { z } from "zod";

import type { ServiceResult } from "@/lib/agents/types";
import { serviceFailure, serviceSuccess } from "@/lib/agents/types";

export function stripJsonFences(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return fenced ? fenced[1].trim() : trimmed;
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
