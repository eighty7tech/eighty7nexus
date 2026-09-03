export type AdminDashboardLayout =
  | "default"
  | "executive"
  | "bento"
  | "analytical"
  | "minimal-luxe"
  | "cyber-hud"
  | "glassmorphic"
  | "compact-dense"
  | "editorial";

export type HeaderButtonStyle =
  | "default"
  | "capsule"
  | "cyber"
  | "glass"
  | "luxe";

export type DashboardWidgetId =
  | "telemetry"
  | "stats"
  | "ordersChart"
  | "recentOrders"
  | "latestProducts"
  | "visitorsChart";

export interface DashboardLayoutMeta {
  id: AdminDashboardLayout;
  title: string;
  shortName: string;
  description: string;
  badge: string;
  defaultButtonStyle: HeaderButtonStyle;
}

export const DASHBOARD_LAYOUT_OPTIONS: DashboardLayoutMeta[] = [
  {
    id: "default",
    title: "Classic Nexus",
    shortName: "Default",
    description: "Standard clean modular admin dashboard layout with classic spacing.",
    badge: "Standard",
    defaultButtonStyle: "default",
  },
  {
    id: "executive",
    title: "Executive Command",
    shortName: "Executive",
    description: "High-throughput operational HUD with animated telemetry, velocity gauge, and live order feed.",
    badge: "Flagship",
    defaultButtonStyle: "capsule",
  },
  {
    id: "bento",
    title: "Bento Grid Studio",
    shortName: "Bento",
    description: "Modern modular bento box layout with animated hover micro-interactions and spotlight cards.",
    badge: "Modular",
    defaultButtonStyle: "capsule",
  },
  {
    id: "analytical",
    title: "Analytical Intelligence",
    shortName: "Analytics",
    description: "Data-dense analytics viewport with multi-metric timeline filters and KPI telemetry strips.",
    badge: "Data-First",
    defaultButtonStyle: "default",
  },
  {
    id: "minimal-luxe",
    title: "Minimalist Luxe",
    shortName: "Minimal",
    description: "Ultra-clean borderless luxury canvas with maximized whitespace, editorial typography, and teal accents.",
    badge: "Refined",
    defaultButtonStyle: "luxe",
  },
  {
    id: "cyber-hud",
    title: "Cyber HUD Terminal",
    shortName: "Cyber HUD",
    description: "Futuristic cyberpunk terminal with glowing neon #77CDCC borders, dark carbon aura, and monospace telemetry.",
    badge: "Cyber",
    defaultButtonStyle: "cyber",
  },
  {
    id: "glassmorphic",
    title: "Glassmorphic Studio",
    shortName: "Glass",
    description: "Ultra-sleek frosted glass floating cards, translucent backdrop blur, and holographic glow accents.",
    badge: "Frosted",
    defaultButtonStyle: "glass",
  },
  {
    id: "compact-dense",
    title: "High-Density Operations",
    shortName: "Dense Ops",
    description: "High-throughput enterprise trading-floor layout with compact padding, tight gaps, and maximum screen throughput.",
    badge: "High-Density",
    defaultButtonStyle: "default",
  },
  {
    id: "editorial",
    title: "Editorial Boutique",
    shortName: "Editorial",
    description: "Fashion & luxury editorial layout with grand typography, asymmetric showcase spreads, and generous breathing room.",
    badge: "Boutique",
    defaultButtonStyle: "luxe",
  },
];
