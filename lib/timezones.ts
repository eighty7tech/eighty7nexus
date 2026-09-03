/**
 * Timezone definitions and utilities for regional settings and UI pickers.
 */

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

/**
 * Standard IANA timezones with GMT/UTC offsets, prioritized with GMT (UTC) at the top.
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: "GMT", label: "GMT - Greenwich Mean Time (GMT+0)", offset: "+00:00" },
  { value: "UTC", label: "UTC - Coordinated Universal Time (UTC+0)", offset: "+00:00" },
  { value: "Africa/Accra", label: "Africa/Accra - Ghana (GMT+0)", offset: "+00:00" },
  { value: "Europe/London", label: "Europe/London - London (GMT+0 / BST+1)", offset: "+00:00" },
  { value: "Africa/Lagos", label: "Africa/Lagos - West Africa Time (WAT / GMT+1)", offset: "+01:00" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg - South Africa (SAST / GMT+2)", offset: "+02:00" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi - East Africa Time (EAT / GMT+3)", offset: "+03:00" },
  { value: "Africa/Cairo", label: "Africa/Cairo - Egypt (EEST / GMT+3)", offset: "+03:00" },
  { value: "Europe/Paris", label: "Europe/Paris - Central European Time (CET / GMT+1)", offset: "+01:00" },
  { value: "Europe/Berlin", label: "Europe/Berlin - Berlin, Frankfurt (CET / GMT+1)", offset: "+01:00" },
  { value: "Europe/Athens", label: "Europe/Athens - Eastern European Time (EET / GMT+2)", offset: "+02:00" },
  { value: "Europe/Moscow", label: "Europe/Moscow - Moscow Standard Time (MSK / GMT+3)", offset: "+03:00" },
  { value: "Asia/Dubai", label: "Asia/Dubai - Gulf Standard Time (GST / GMT+4)", offset: "+04:00" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh - Arabia Standard Time (AST / GMT+3)", offset: "+03:00" },
  { value: "Asia/Karachi", label: "Asia/Karachi - Pakistan Standard Time (PKT / GMT+5)", offset: "+05:00" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata - India Standard Time (IST / GMT+5:30)", offset: "+05:30" },
  { value: "Asia/Dhaka", label: "Asia/Dhaka - Bangladesh Standard Time (BST / GMT+6)", offset: "+06:00" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok - Indochina Time (ICT / GMT+7)", offset: "+07:00" },
  { value: "Asia/Singapore", label: "Asia/Singapore - Singapore Standard Time (SGT / GMT+8)", offset: "+08:00" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai - China Standard Time (CST / GMT+8)", offset: "+08:00" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong - Hong Kong Time (HKT / GMT+8)", offset: "+08:00" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo - Japan Standard Time (JST / GMT+9)", offset: "+09:00" },
  { value: "Asia/Seoul", label: "Asia/Seoul - Korea Standard Time (KST / GMT+9)", offset: "+09:00" },
  { value: "Australia/Sydney", label: "Australia/Sydney - Australian Eastern Time (AEST / GMT+10)", offset: "+10:00" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland - New Zealand (NZST / GMT+12)", offset: "+12:00" },
  { value: "America/New_York", label: "America/New_York - Eastern Time (EST / GMT-5)", offset: "-05:00" },
  { value: "America/Chicago", label: "America/Chicago - Central Time (CST / GMT-6)", offset: "-06:00" },
  { value: "America/Denver", label: "America/Denver - Mountain Time (MST / GMT-7)", offset: "-07:00" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles - Pacific Time (PST / GMT-8)", offset: "-08:00" },
  { value: "America/Anchorage", label: "America/Anchorage - Alaska Time (AKST / GMT-9)", offset: "-09:00" },
  { value: "Pacific/Honolulu", label: "Pacific/Honolulu - Hawaii Time (HST / GMT-10)", offset: "-10:00" },
  { value: "America/Toronto", label: "America/Toronto - Canada Eastern (EST / GMT-5)", offset: "-05:00" },
  { value: "America/Vancouver", label: "America/Vancouver - Canada Pacific (PST / GMT-8)", offset: "-08:00" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo - Brasilia Time (BRT / GMT-3)", offset: "-03:00" },
  { value: "America/Buenos_Aires", label: "America/Buenos_Aires - Argentina Time (ART / GMT-3)", offset: "-03:00" },
];
