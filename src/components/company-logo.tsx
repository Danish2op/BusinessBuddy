"use client";

import { useMemo, useState } from "react";

type CompanyLogoProps = {
  name: string;
  website?: string | null;
  logoUrl?: string | null;
  className?: string;
};

function domainFromUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function originFromUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function CompanyLogo({ name, website, logoUrl, className = "h-10 w-10" }: CompanyLogoProps) {
  const [index, setIndex] = useState(0);
  const candidates = useMemo(() => {
    const origin = originFromUrl(website);
    const domain = domainFromUrl(website);

    return unique([
      logoUrl,
      origin ? `${origin}/favicon.ico` : null,
      origin ? `${origin}/apple-touch-icon.png` : null,
      domain ? `https://logo.clearbit.com/${domain}` : null
    ]);
  }, [logoUrl, website]);

  const current = candidates[index];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

  if (!current) {
    return (
      <div className={`${className} flex shrink-0 items-center justify-center rounded border border-[var(--border-muted)] bg-[rgba(225,179,74,0.09)] text-xs font-semibold text-[var(--amber)]`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      alt={`${name} logo`}
      className={`${className} shrink-0 rounded border border-[var(--border-muted)] bg-white object-contain p-1`}
      src={current}
      onError={() => setIndex((next) => next + 1)}
    />
  );
}
