import type { HeaderButtonStyle } from "@/components/admin/dashboard/dashboard-layout-types";

/**
 * Returns Tailwind class strings for admin header action buttons based on the
 * active HeaderButtonStyle setting. Both `dashboard-header.tsx` and
 * `admin-header.tsx` import from here to keep the two surfaces in sync.
 */
export function buttonClassFor(
  style: HeaderButtonStyle,
  variant: "secondary" | "primary",
): string {
  switch (style) {
    case "capsule":
      return variant === "secondary"
        ? "rounded-full border border-border/80 bg-card/90 px-5 shadow-md transition-all hover:bg-muted hover:border-[#77CDCC]/60"
        : "rounded-full bg-gradient-to-r from-[#001a45] to-[#324071] px-5 text-white shadow-lg transition-all hover:brightness-110 ring-1 ring-[#77CDCC]/40";
    case "cyber":
      return variant === "secondary"
        ? "rounded-md border border-[#77CDCC]/40 bg-[#001a45]/80 font-mono text-xs text-[#77CDCC] shadow-xs transition-all hover:border-[#77CDCC] hover:bg-[#001a45]"
        : "rounded-md border-2 border-[#77CDCC] bg-[#001a45] font-mono text-xs text-white shadow-[0_0_15px_rgba(119,205,204,0.3)] transition-all hover:bg-[#002868]";
    case "glass":
      return variant === "secondary"
        ? "rounded-2xl border border-white/40 bg-card/60 backdrop-blur-xl px-4 shadow-sm transition-all hover:bg-card/90"
        : "rounded-2xl border border-white/20 bg-primary/90 backdrop-blur-xl px-4 text-primary-foreground shadow-md transition-all hover:bg-primary";
    case "luxe":
      return variant === "secondary"
        ? "rounded-sm border-b border-border/80 bg-transparent px-3 font-serif tracking-wide transition-all hover:bg-muted/40"
        : "rounded-sm border-b-2 border-[#77CDCC] bg-primary/10 px-3 text-foreground font-serif tracking-wide transition-all hover:bg-primary/20";
    case "default":
    default:
      return variant === "secondary"
        ? "rounded-[10px] border border-border bg-card shadow-xs transition-all hover:border-foreground/20 hover:bg-muted/60"
        : "rounded-[10px] bg-primary text-primary-foreground shadow-xs transition-all hover:bg-primary/90";
  }
}
