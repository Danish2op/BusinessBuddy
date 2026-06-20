import "server-only";

import type { ServiceResult } from "@/lib/agents/types";
import { serviceFailure, serviceSuccess } from "@/lib/agents/types";
import { getServerEnv } from "@/lib/env";

type Fetcher = typeof fetch;
type EnvSource = Record<string, string | undefined>;

export type ResendClientOptions = {
  apiKey?: string;
  env?: EnvSource;
  fetcher?: Fetcher;
  fromEmail?: string;
};

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
};

type ResendSuccessPayload = {
  id?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function resolveConfig(options: ResendClientOptions): { apiKey: string; fromEmail: string } {
  if (options.apiKey && options.fromEmail) {
    return {
      apiKey: options.apiKey,
      fromEmail: options.fromEmail
    };
  }

  const env = getServerEnv(options.env);
  return {
    apiKey: options.apiKey ?? env.RESEND_API_KEY,
    fromEmail: options.fromEmail ?? env.RESEND_FROM_EMAIL
  };
}

export function createResendClient(options: ResendClientOptions = {}) {
  const { apiKey, fromEmail } = resolveConfig(options);
  const fetcher = options.fetcher ?? fetch;

  async function sendEmail(input: SendEmailInput): Promise<ServiceResult<{ id: string }>> {
    try {
      const response = await fetcher(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          reply_to: input.replyTo
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ResendSuccessPayload;
      if (!response.ok) {
        return serviceFailure({
          code: "email_send_failed",
          message: "Email provider rejected the send request.",
          provider: "resend",
          status: response.status,
          retryable: response.status >= 500 || response.status === 429
        });
      }

      if (!payload.id) {
        return serviceFailure({
          code: "email_invalid_response",
          message: "Email provider returned an invalid response.",
          provider: "resend",
          status: response.status,
          retryable: true
        });
      }

      return serviceSuccess({ id: payload.id });
    } catch {
      return serviceFailure({
        code: "email_network_error",
        message: "Email send request could not be completed.",
        provider: "resend",
        retryable: true
      });
    }
  }

  return {
    sendEmail
  };
}
