import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { isAllowedRequestOrigin } from "@/lib/security/origin";

export function rejectDisallowedOrigin(request: Request) {
  const env = getServerEnv();
  if (isAllowedRequestOrigin(request.headers, { appUrl: env.NEXT_PUBLIC_APP_URL })) {
    return null;
  }

  return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
}
