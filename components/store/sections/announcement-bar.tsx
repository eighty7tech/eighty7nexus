import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * The slim strip above the header — free-shipping notices, sale windows,
 * store announcements. Colors come from the section settings (empty means
 * the theme's primary scheme); the whole bar is the link when one is set.
 */
export function AnnouncementBar({
  locale,
  text,
  href,
  backgroundColor,
  textColor,
}: {
  locale: string;
  text: string;
  href: string;
  backgroundColor: string;
  textColor: string;
}) {
  if (!text.trim()) return null;

  const style = {
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(textColor ? { color: textColor } : {}),
  };
  const body = (
    <span className="inline-flex items-center justify-center gap-1.5">
      <span className="truncate">{text}</span>
      {href ? <ArrowRight className="h-3.5 w-3.5 shrink-0 rtl:rotate-180" /> : null}
    </span>
  );
  const className =
    "block w-full px-4 py-2 text-center text-[13px] font-medium leading-5";
  const fallbackClass = backgroundColor
    ? ""
    : " bg-primary text-primary-foreground";

  if (href) {
    const target = href.startsWith("http") ? href : `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
    const external = href.startsWith("http");
    return external ? (
      <a
        href={target}
        target="_blank"
        rel="noopener noreferrer"
        className={className + fallbackClass + " transition-opacity hover:opacity-90"}
        style={style}
      >
        {body}
      </a>
    ) : (
      <Link
        href={target}
        className={className + fallbackClass + " transition-opacity hover:opacity-90"}
        style={style}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={className + fallbackClass} style={style}>
      {body}
    </div>
  );
}
