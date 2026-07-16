import "server-only";

import { validHttpOrigin } from "./request-guard";

const EMAIL_ADDRESS_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export type ReportEmailConfig = {
  apiKey: string;
  from: string;
  allowedOrigin: string;
  allowlist: Set<string>;
};

function isEmailAddress(value: string) {
  return value.length <= 320 && EMAIL_ADDRESS_PATTERN.test(value);
}

function isValidSender(value: string) {
  if (value.length > 500 || /[\r\n]/.test(value)) return false;
  const displayNameMatch = value.match(/^.+\s<([^<>]+)>$/);
  return isEmailAddress((displayNameMatch?.[1] ?? value).trim());
}

export function getReportEmailConfig(): ReportEmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const allowedOrigin = validHttpOrigin(process.env.APP_ORIGIN);
  const allowlist = new Set(
    (process.env.REPORT_EMAIL_ALLOWLIST ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

  if (
    !apiKey ||
    !from ||
    !isValidSender(from) ||
    !allowedOrigin ||
    allowlist.size === 0 ||
    allowlist.size > 100 ||
    [...allowlist].some((email) => !isEmailAddress(email))
  ) {
    return null;
  }

  return { apiKey, from, allowedOrigin, allowlist };
}
