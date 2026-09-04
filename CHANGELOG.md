# Changelog

## [2026-09-04] - Ghana Delivery Methods Multi-Select

### Added:
- **AI Sales Agent Delivery Wizard**: Implemented the "Ghana Delivery/Logistics/Install Wizard" interactive widget for the AI Sales Agent. When customers ask about delivery to regions in Ghana, Dispatch Riders, MoMo/COD payment, or installation services, the AI now routes them to a dynamic UI card to capture their region and installation preference before proceeding to checkout.
- **Bulk Delete Capabilities**: Added multi-select checkboxes to the `GhanaDeliveryCard` in the Shipping Settings. Merchants can now easily select multiple delivery methods or "Select All" to bulk delete them, streamlining the process of resetting or overhauling regional delivery configurations.

## [2026-09-04] - Premium Track Order Redesign & Admin Settings

### Added:
- **Track Order Admin Page**: Redesigned the Track Order settings tab (`track-order-settings-tab.tsx`) to feature visual theme cards and toggles for Ghana-specific delivery options (GhanaPostGPS, Dispatch Rider Info, MoMo/COD Tracking).
- **Track Order UI Components**: Added `components/store/track-order-timeline.tsx` to isolate and handle a highly animated, horizontal/vertical delivery progress timeline.
- **Ghana Delivery Integrations**: Order tracking now renders conditional blocks for map verification, rider details, and MoMo payment warnings based on the active tracking status and admin settings.
- **Translations**: Added all text strings related to the new track order redesign and admin settings to `locales/en.json`.

### Improvements:
- **Premium Order Tracking UI**: Rebuilt the track order page to completely eliminate generic components. Introduced glassmorphic layouts, animated pulses, and sleek progress milestones.
- **Scan History Integration**: Integrated the detailed courier `ScanHistory` directly into the main tracking timeline milestones rather than appending it to the bottom of the page.
- **Localization**: Removed all hardcoded english text from `track-order-content.tsx`, fully migrating to `next-intl`.

### Fixes:
- **AI Widget Theme Types**: Fixed TypeScript type overlap errors in `widget-tab.tsx` and `settings.ts` by updating legacy widget theme values (`nexus-glass`, `nexus-cyber-hud`, `nexus-capsule`) to the new values (`aether-core`, `quantum-sentience`, `helix-synth`).
- **Vendor Page Guard**: Fixed the page guard import path and parameters in the vendor `ai-sales-agent/page.tsx` route to correctly enforce `requireVendorAreaAccess`.
- **Vendor API Authentication**: Corrected the `auth: "vendor"` configuration in the `app/api/vendor/ai-sales-agent/route.ts` API route handler to correctly use `auth: "user"` along with `requireApprovedVendorByUserId` for accurate vendor context validation.

## [2026-09-04] - Fix Vercel Serverless Upload Issue

### Added:
- None

### Improvements:
- **Floating Tabs UI**: Enforced default uneditable labels and icons for "AI Assistant" and "Back to Top" special tab types.

### fixes:
- **Floating Tabs Translations**: Fixed incorrect translation keys (`admin.settings.floatingTabs.floatingTabs.title` -> `title` and `description`) so that the header title and description render correctly.
- **Vercel Image Upload**: Added `sharp` to `serverExternalPackages` in `next.config.ts` so that Next.js correctly preserves native binaries when deployed to Vercel, preventing 'upload failed' errors when optimizing pictures using Cloudflare R2 on Vercel.

## [2026-09-03] - Dashboard Templates, Product Styles, Checkout Layout, and Bug Fixes

### Added:
- **Project Upgrades Roadmap**: Created `UPGRADES.md` detailing potential future features, architectural improvements, and scaling strategies for the platform.
- **Bulk Select for Delivery Options**: Added a "Select All" and "Deselect All" button to the `MultiSelectDropdown` in the Delivery Methods dialog, allowing easier configuration of region and city coverage.
- **Global Dashboard Settings**: Moved Dashboard Theme and Layout Template selection into the main \Appearance Settings\ panel to ensure layout configuration remains globally synced.
- **Product Card Styles Config**: Added UI options to select between modern storefront product card styles (\Showcase\, \Editorial\, \Glassmorphic\, \Minimal Luxe\) within the \/admin/online-store/product-pages\ builder. Replaced the outdated 'Cyber' style with the new 'Glassmorphic' modern aesthetic.

### Improvements:
- **Checkout Ghana Delivery Method Options**: Updated the checkout Ghana delivery method layout to support rendering as a compact, single-column list. Added a configuration toggle in the Constrained Checkout Builder to switch between grid and list layout.

### Fixes:
- **Dashboard Theme Hydration**: Added \dashboardTemplate\ and \headerButtonStyle\ to the server-side hydration payload in \pp/layout.tsx\ so the dashboard layout correctly persists and renders on load instead of reverting to defaults.

- **Checkout Ghana Delivery Method Layout Bug**: Fixed a bug where the Single-Column list toggle for Ghana Delivery Methods was reverting to the default grid on the storefront. The \checkout\ layout configuration has been properly exposed to the public settings API payload to ensure storefront components can read and render the configured layout preference.

- **Settings API Whitelist**: Added \dashboardTemplate\ and \headerButtonStyle\ to the allowed fields array in \pp/api/admin/settings/route.ts\ to prevent these configurations from being stripped and reverting to defaults on save.

- **Ghana GPS Strict Format**: Enhanced the checkout validation layer to strictly enforce the \AS-123-4567\ address format for Ghana GPS postal addresses during checkout.

- **Validation Errors Resolved**: Fixed Mongoose \ValidationError\s for \shippingAddress.postalCode\ and \illingAddress.postalCode\ by making \postalCode\ an optional field across \order\, \user\, \customer-profile\, \shipment\, and \wholesale-company\ schemas. This properly accommodates regional address formats lacking standard postal codes.
- **POS Interface Clean Up**: Removed the redundant "No quick keys configured" placeholder state from the POS quick-keys grid interface for a cleaner experience when no shortcut keys are present.


## [2026-09-03] — Unified Admin Header Button Styling & Always-On Dashboard Drag-and-Drop

### Added:
- **Global Admin Header Button Styling (`lib/admin-header-button-style.ts`, `components/admin/settings/sections/appearance-settings-tab.tsx`)**:
  - Moved the dashboard header button style picker (Default, Capsule, Cyber, Glass, Luxe) to the global Appearance Settings > Brand Assets panel.
  - Implemented live preview cards for each button style directly in the settings tab.
  - Applied the selected button style globally to the `POS`, `Multi-Branch`, and `Visit Website` action buttons in the main `AdminHeader`, as well as the Dashboard header analytics and order buttons.
- **Always-On Dashboard Widget Reordering (`components/admin/dashboard/dashboard-layout-controller.tsx`)**:
  - Refactored the Dashboard layout controller to exclusively render the `DashboardDraggableContainer`, ensuring the widget drag-and-drop handles are permanently visible and functional without needing to enter a custom mode.

### Removed:
- **Legacy Layout Switchers (`components/admin/dashboard/dashboard-layout-bar.tsx`, `components/admin/settings/sections/pos-settings-tab.tsx`, `components/pos/pos-terminal.tsx`)**:
  - Removed the complex 9-layout dashboard switcher ribbon from the dashboard layout bar.
  - Removed the "Trigger Scale" test button and associated hardware modal from POS settings to clean up the interface.
  - Removed the POS layout switcher ribbon and scale trigger button from the `/admin/pos` terminal to provide a cleaner native register interface.

## [2026-09-03] — Auth UI Logos & Background Graphics Uploads, 3 New Advanced Footers, and Centralized Newsletter Settings

### Added:
- **Logos & Background Graphics Upload System (`models/settings.model.ts`, `components/admin/online-store/login-page-builder.tsx`, `components/admin/settings/sections/appearance-settings-tab.tsx`, `components/auth/modern-auth-popup.tsx`)**:
  - Integrated `ImageUploadField` drag-and-drop file upload (with MediaUploader and text URL fallback) for:
    - **Custom Auth Logo**: Top of auth card / split banner (`https://example.com/logo.png`, leave empty to use main store logo).
    - **Full-Page Backdrop Wallpaper**: Full page backdrop wallpaper image for Modern Glass & Centered card designs (`https://images.unsplash.com/...`).
    - **Side Hero Banner Graphic**: Left marketing panel banner for Classic Split & Corporate styles (`https://images.unsplash.com/...`).
    - **Custom Auth Greeting Heading & Subheading**: Greeting headline (e.g. `Welcome Back to Eighty7`) and subtitle copy.
  - Enabled in both the Online Store Login Page Builder (Tab 2) and Appearance Settings (Authentication UI section).
- **3 New Advanced Project-Themed Footer Layouts (`lib/footer-config.ts`, `components/admin/online-store/footer-builder.tsx`, `components/layout/store-footer.tsx`)**:
  - `Nexus Flagship Mega-Aura (`nexus-flagship`)`: Tiered mega-footer with midnight gradient background (`#001a45` to `#324071`), ambient cyan glowing aura (`#77CDCC`), brand manifesto strip, VIP club badge, newsletter subscription card, structured category links, and trust payment badges.
  - `Nexus Cyber HUD Terminal (`nexus-cyber-grid`)`: Cybernetic command deck footer with dark carbon styling (`#000d24`), neon cyan border accents (`#77CDCC`), live network status beacon, terminal-style command prompt newsletter input (`$ subscribe --email`), monospace telemetry, and system uptime monitor.
  - `Nexus Editorial Boutique (`nexus-editorial-minimal`)`: Haute-couture luxury editorial boutique footer with clean serif typography, minimal asymmetric 2-column layout, understated newsletter invite, refined social badges, and centered luxury brand insignia.
- **Centralized Newsletter Settings for All Newsletter Forms (`lib/footer-config.ts`, `components/admin/online-store/footer-builder.tsx`, `components/layout/store-footer.tsx`)**:
  - Added centralized newsletter schema and settings editor card in the Footer Builder (`enabled`, `title`, `subtitle`, `placeholder`, `buttonText`, `successMessage`, `discountBadge`).
  - Dynamic connection across all storefront newsletter forms (`renderNewsletterHero`, `renderNexusFlagship`, `renderNexusCyberGrid`, `renderNexusEditorialMinimal`), with live client-side validation and toast notifications.

### Improvements:
- **Auth Popup Dynamic Branding (`components/auth/modern-auth-popup.tsx`, `components/layout/store-header.tsx`)**:
  - Extended storefront `ModernAuthPopup` to dynamically apply custom background wallpaper, side hero marketing banner, and customized greeting headline/subheading saved in settings.

### Fixes:
- **Dashboard Theme Hydration**: Added \dashboardTemplate\ and \headerButtonStyle\ to the server-side hydration payload in \pp/layout.tsx\ so the dashboard layout correctly persists and renders on load instead of reverting to defaults.

- **Checkout Ghana Delivery Method Layout Bug**: Fixed a bug where the Single-Column list toggle for Ghana Delivery Methods was reverting to the default grid on the storefront. The \checkout\ layout configuration has been properly exposed to the public settings API payload to ensure storefront components can read and render the configured layout preference.

- **Settings API Whitelist**: Added \dashboardTemplate\ and \headerButtonStyle\ to the allowed fields array in \pp/api/admin/settings/route.ts\ to prevent these configurations from being stripped and reverting to defaults on save.

- **Ghana GPS Strict Format**: Enhanced the checkout validation layer to strictly enforce the \AS-123-4567\ address format for Ghana GPS postal addresses during checkout.

- **JSX Comment Node Syntax in Cyber Footers (`components/admin/online-store/footer-builder.tsx`, `components/layout/store-footer.tsx`)**:
  - Resolved `react/jsx-no-comment-textnodes` ESLint errors by wrapping raw `//` and `>` terminal strings into JSX string expressions.

## [2026-09-03] — 6 POS Workstation Layout Styles, POS Settings Scale Trigger, and AdminLayout/POSLayout Enum Validation Fix

### Added:
- **6 POS Workstation Layout Styles (`models/settings.model.ts`, `components/admin/settings/sections/pos-settings-tab.tsx`, `components/pos/pos-terminal.tsx`)**:
  - `Classic Split (`classic`)`: Balanced 2-column workflow with product catalog on left and live running cart receipt ticket on right.
  - `Grocery & Quick Touch (`touch_grocery`)`: Touch-first oversized cards with integrated 4x4 keypad, rapid tender bills (`Exact`, `+20`, `+50`, `+100`), and electronic scale trigger.
  - `Barcode Scan Express (`scan_compact`)`: Laser scanner gun-optimized express stream with live scan ticker, compact line items, and instant checkout bar.
  - `Visual Retail Boutique (`grid_visual`)`: High-visual catalog grid with variant swatch chips, visual category cards, and slide-out drawer cart.
  - `Self-Service Express Kiosk (`kiosk_self`)`: Self-checkout touch kiosk interface with oversized category badges, instant tap-to-add, and prominent pay trigger.
  - `Quick-Serve Dining & Cafe (`restaurant_cafe`)`: Food & beverage workflow with Dine-In, Takeaway, and Delivery order tags, table notes, and kitchen ticket sync.
- **Electronic Weight Scale Diagnostic & Manual Trigger in POS Settings (`components/admin/settings/sections/pos-settings-tab.tsx`)**:
  - Added direct "Trigger Scale" test button and `<WeightScaleDialog>` diagnostic modal in Section 2b of POS Settings for testing USB, serial, and manual scale readings.

### Improvements:
- **Live 6-Style POS Layout Switcher Ribbon (`components/pos/pos-terminal.tsx`)**:
  - Mounted live 6-style layout switcher toolbar at the top of `/pos` using the project theme palette (`#001a45`, `#324071`, `#77CDCC`), with `localStorage` persistence (`"active_pos_layout_mode"`).

### Fixes:
- **Dashboard Theme Hydration**: Added \dashboardTemplate\ and \headerButtonStyle\ to the server-side hydration payload in \pp/layout.tsx\ so the dashboard layout correctly persists and renders on load instead of reverting to defaults.

- **Checkout Ghana Delivery Method Layout Bug**: Fixed a bug where the Single-Column list toggle for Ghana Delivery Methods was reverting to the default grid on the storefront. The \checkout\ layout configuration has been properly exposed to the public settings API payload to ensure storefront components can read and render the configured layout preference.

- **Settings API Whitelist**: Added \dashboardTemplate\ and \headerButtonStyle\ to the allowed fields array in \pp/api/admin/settings/route.ts\ to prevent these configurations from being stripped and reverting to defaults on save.

- **Ghana GPS Strict Format**: Enhanced the checkout validation layer to strictly enforce the \AS-123-4567\ address format for Ghana GPS postal addresses during checkout.

- **Mongoose Schema Enum Validation on `appearance.adminLayout` & `pos.posLayout` (`models/settings.model.ts`)**:
  - Resolved `Settings validation failed: appearance.adminLayout: 'minimal' is not a valid enum value` by extending schema enums to include `["cards", "dense", "studio", "minimal", "command"]` for `adminLayout` and `["classic", "touch_grocery", "scan_compact", "grid_visual", "kiosk_self", "restaurant_cafe"]` for `posLayout`.

## [2026-09-03] — Full-Page Dashboard Theming, 9 Dashboard Layouts, Header Button Styles, and Drag-and-Drop Reordering

### Added:
- **4 Additional Script-Themed Dashboard Layouts & Classic Default (Total 9 Layouts) (`components/admin/dashboard/`)**:
  - `Classic Nexus (`default`)`: Clean standard modular admin dashboard layout with classic spacing.
  - `Nexus Cyber HUD Terminal (`cyber-hud`)`: Futuristic cyberpunk command terminal with neon `#77CDCC` border auras, scanline ambiance, dark carbon canvas (`#000d24`), and monospace telemetry.
  - `Nexus Glassmorphic Studio (`glassmorphic`)`: Ultra-sleek frosted glass floating cards with `backdrop-blur-2xl`, translucent borders, and iridescent holographic glows.
  - `Nexus High-Density Operations (`compact-dense`)`: Enterprise trading-floor layout with compact padding, tight gaps, and maximum screen information throughput.
  - `Nexus Editorial Boutique (`editorial`)`: Fashion & luxury boutique editorial layout with grand typography, asymmetric showcase spreads, and generous breathing room.
- **Interactive Drag-and-Drop Dashboard Widget Reordering (`components/admin/dashboard/dashboard-draggable-container.tsx`)**:
  - Full drag-and-drop reordering for all dashboard cards (KPI Metrics, Orders Performance Chart, Recent Transactions, Latest Products, Visitors Analytics).
  - Visual drop indicators, step move buttons (`ArrowUp`, `ArrowDown`), `localStorage` persistence (`"nexus_admin_dashboard_widget_order"`), and a 1-click "Reset Default Positions" button.
- **5 Selectable Header Button Styles (`components/admin/dashboard-header.tsx`, `components/admin/dashboard/dashboard-layout-bar.tsx`)**:
  - `capsule`: Organic pill button with glowing accent.
  - `cyber`: High-tech cyberpunk button with glowing neon `#77CDCC` border.
  - `glass`: Frosted glassmorphic button with backdrop blur.
  - `luxe`: Minimalist borderless button with fine hairline accents.
  - `default`: Clean rounded button.
  - Selectable directly via the sub-bar toolbar and saved in `localStorage`.

### Improvements:
- **Full-Page Dashboard Theming (`components/admin/dashboard/dashboard-layout-controller.tsx`)**:
  - Extended dashboard layout theming to the entire page canvas (full-bleed backgrounds, ambient cyan radial glows for Cyber HUD, frosted mesh gradients for Glassmorphic, and streamlined borders for Minimal Luxe).
- **Expanded Dashboard Layout Switcher Toolbar (`components/admin/dashboard/dashboard-layout-bar.tsx`)**:
  - Redesigned toolbar with 9 layout buttons, active glowing pills, header button style selector, and drag-and-drop status indicators.

### Fixes:
- **Dashboard Theme Hydration**: Added \dashboardTemplate\ and \headerButtonStyle\ to the server-side hydration payload in \pp/layout.tsx\ so the dashboard layout correctly persists and renders on load instead of reverting to defaults.

- **Checkout Ghana Delivery Method Layout Bug**: Fixed a bug where the Single-Column list toggle for Ghana Delivery Methods was reverting to the default grid on the storefront. The \checkout\ layout configuration has been properly exposed to the public settings API payload to ensure storefront components can read and render the configured layout preference.

- **Settings API Whitelist**: Added \dashboardTemplate\ and \headerButtonStyle\ to the allowed fields array in \pp/api/admin/settings/route.ts\ to prevent these configurations from being stripped and reverting to defaults on save.

- **Ghana GPS Strict Format**: Enhanced the checkout validation layer to strictly enforce the \AS-123-4567\ address format for Ghana GPS postal addresses during checkout.

- **Fixed Dashboard Theme Scope (`components/admin/dashboard/dashboard-layout-controller.tsx`)**:
  - Fixed theme scoping to style the full page container rather than being restricted to inner containers.

## [2026-09-03] — 4 Interactive Animated Dashboard Layouts, 4 AI Sales Agent Chat Box Widget Themes, and Live Admin Selector

### Added:
- **4 Interactive Animated Dashboard Layouts (`components/admin/dashboard/`)**:
  - `Executive Command`: High-throughput operational HUD with real-time telemetry banner, animated pulsing radar beacon, active clock ticker, and split analytics/orders layout using script brand palette (`#001a45`, `#324071`, `#77CDCC`).
  - `Bento Grid Studio`: Modern modular bento layout featuring 3 quick-launch tiles (AI Sales Copilot, POS Register, Inventory Flow), hover lift animations, and responsive asymmetrical grid.
  - `Analytical Intelligence`: Data-first intelligence canvas with interactive timeframe tabs (`Today`, `7 Days`, `30 Days`, `This Quarter`, `Year to Date`), dual chart stage, and granular transactions feed.
  - `Minimalist Luxe`: Ultra-clean borderless luxury canvas with maximized whitespace, subtle glowing borders (`#77CDCC`), and editorial presentation.
- **Interactive Dashboard Layout Switcher Toolbar (`components/admin/dashboard/dashboard-layout-bar.tsx`, `components/admin/dashboard/dashboard-layout-controller.tsx`)**:
  - Mounted at the top of `/admin/dashboard` with animated Lucide icons (`Cpu`, `LayoutGrid`, `LineChart`, `Sparkles`), active indicator glowing pills, and `localStorage` persistence (`"nexus_admin_dashboard_layout"`).
- **4 New AI Sales Agent Chat Box Widget Themes (`models/settings.model.ts`, `lib/ai-sales-agent/settings.ts`, `app/api/admin/ai-sales-agent/route.ts`)**:
  - `Nexus Modern Pro`: Signature script gradient header (`#001a45` to `#324071`), `#77CDCC` glowing online beacon, rounded card contour.
  - `Glassmorphic Studio`: Translucent frosted glass panel with backdrop blur (`backdrop-blur-2xl`), holographic accents, and glass input pill.
  - `Cyber HUD Terminal`: High-tech neon glowing border accents (`#77CDCC`), dark midnight backdrop (`#000d24`), pulsing beacon dot, monospace telemetry status, and terminal command input.
  - `Floating Capsule`: Organic pill capsule header, avatar halo with glowing ring, and modern bubble message styling.
- **4-Card Visual Widget Theme Selector in Admin (`components/admin/ai-sales-agent-admin/widget-tab.tsx`)**:
  - Added interactive visual selector on `/admin/ai-sales-agent` (Widget tab) with real-time live preview synchronization and instantaneous theme switching.

### Improvements:
- **Storefront Customer AI Chat Box Widget Styling (`components/ai-sales-agent/ai-sales-agent-widget.tsx`)**:
  - Updated storefront chat widget to dynamically render the active widget theme styling (`nexus-modern`, `nexus-glass`, `nexus-cyber-hud`, `nexus-capsule`).
- **Dashboard Stat Card Micro-Animations (`components/admin/dashboard-stat-card.tsx`)**:
  - Enhanced KPI stat cards with smooth hover border glow, card elevation, and rotating scaling icon animations (`group-hover:scale-110 group-hover:rotate-6 group-hover:text-[#77CDCC]`).

### Fixes:
- **Dashboard Theme Hydration**: Added \dashboardTemplate\ and \headerButtonStyle\ to the server-side hydration payload in \pp/layout.tsx\ so the dashboard layout correctly persists and renders on load instead of reverting to defaults.

- **Checkout Ghana Delivery Method Layout Bug**: Fixed a bug where the Single-Column list toggle for Ghana Delivery Methods was reverting to the default grid on the storefront. The \checkout\ layout configuration has been properly exposed to the public settings API payload to ensure storefront components can read and render the configured layout preference.

- **Settings API Whitelist**: Added \dashboardTemplate\ and \headerButtonStyle\ to the allowed fields array in \pp/api/admin/settings/route.ts\ to prevent these configurations from being stripped and reverting to defaults on save.

- **Ghana GPS Strict Format**: Enhanced the checkout validation layer to strictly enforce the \AS-123-4567\ address format for Ghana GPS postal addresses during checkout.

- **TypeScript Generic Typing in AI Sales Agent Normalization (`lib/ai-sales-agent/settings.ts`)**:
  - Corrected `toPlain<T>` generic typing to return `Partial<NonNullable<T>>` to prevent type inference degradation on null/undefined input states.

## [2026-09-03] — Ghana Unified Delivery Checkout, 4 Script Theme Product Cards, Order Tracking Overhaul, System Management _backup Restore, and 5 Admin Layout Themes

### Added:
- **System Management Direct Restore from `./_backup` Directory (`lib/system/backup-restore-service.ts`, `app/[locale]/admin/system-management/page.tsx`)**:
  - Implemented automatic recursive scanning for JSON snapshot backups residing in `./_backup` as well as `./backups`.
  - Added visual `_backup` provenance badge in the System Management restore panel for full visibility.
  - Enabled 1-click snapshot rollback directly from any archive file placed in `./_backup`.
- **4 New Script-Themed Storefront Product Display Cards (`lib/products/product-card-config.ts`)**:
  - `nexus-showcase`: Signature flagship product presentation featuring script primary brand tone (`#001a45`), rounded card contour, zoom hover stage, and vibrant accent badges (`#77CDCC`).
  - `nexus-editorial`: Luxury fashion & boutique card with clean lines, secondary midnight backdrop (`#324071`), second-image flip preview, and brand typography.
  - `nexus-cyber-hud`: High-tech cybernetic HUD card with `#77CDCC` glowing border accents, high-contrast monospace price tags, and persistent quick-action cart button.
  - `nexus-minimal-luxe`: Ultra-minimalist luxury card with borderless fluid styling, generous negative space, and rounded pill add-to-cart trigger.
- **2 New Settings & Admin Workspace Layout Themes (`components/admin/settings/types.ts`, `stores/app-settings.ts`, `components/admin/settings/settings-shell.tsx`, `components/admin/settings/sections/appearance-settings-tab.tsx`)**:
  - Added `minimal`: Distraction-free borderless flat workspace with maximized whitespace and clean line dividing accents.
  - Added `command`: High-efficiency power-user command HUD with glowing borders, monospaced metadata badges, and expanded terminal-style canvas.
  - Expanded Settings Shell layout switcher ribbon and Appearance Settings tab to support all 5 layout stacks (`cards`, `dense`, `studio`, `minimal`, `command`).
- **Rebuilt Order Tracking Experience with Script Brand Palette (`components/store/track-order-content.tsx`)**:
  - Set default tracking theme to `"nexus-theme"` with script brand palette (primary `#001a45`, secondary `#324071`, default accent `#77CDCC`).
  - Added **Courier & Dispatch Telemetry Card** featuring vehicle icons (`Truck`, `Zap`), tracking badge, and live courier route indicator.
  - Added **Interactive Milestone Timeline Stepper** with `#77CDCC` step connectors, pulsing active ring, and scan timestamp.
  - Added **Expandable Order Items Accordion** with product thumbnails, SKU numbers, quantities, prices, and complete financial breakdown (subtotal, discounts, delivery fee, taxes).
  - Added **WhatsApp Delivery Alerts Toggle** with interactive opt-in status.
  - Added **1-Click Invoice & Delivery Receipt Download** button with feedback toast.
  - Added **Support Quick-Connect** action card for 24/7 customer assistance.

### Improvements:
- **Unified Ghana Delivery Checkout Experience (`components/checkout/checkout-content.tsx`, `components/checkout/ghana-delivery-method-selector.tsx`)**:
  - Replaced ambiguous "shipping" terminology with "delivery" across Ghana checkout workflows (Delivery Address, Delivery Method, Delivery Fee, Delivery Information).
  - Combined shipping and billing address into a single unified Delivery Address entry for Ghana shoppers, eliminating redundant duplicate forms.
  - Redesigned Ghana Delivery Method selector cards with carrier badges, estimated delivery days, and nationwide/regional coverage indicators.
- **POS Terminal Clean Native Layout (`components/pos/pos-terminal.tsx`, `components/admin/settings/sections/pos-settings-tab.tsx`)**:
  - Removed experimental POS layout mode switcher ribbon and layout overrides to provide a clean, uncluttered native terminal experience.
  - Preserved hardware electronic weight scale integration button in the header status bar.

### Fixes:
- **Dashboard Theme Hydration**: Added \dashboardTemplate\ and \headerButtonStyle\ to the server-side hydration payload in \pp/layout.tsx\ so the dashboard layout correctly persists and renders on load instead of reverting to defaults.

- **Checkout Ghana Delivery Method Layout Bug**: Fixed a bug where the Single-Column list toggle for Ghana Delivery Methods was reverting to the default grid on the storefront. The \checkout\ layout configuration has been properly exposed to the public settings API payload to ensure storefront components can read and render the configured layout preference.

- **Settings API Whitelist**: Added \dashboardTemplate\ and \headerButtonStyle\ to the allowed fields array in \pp/api/admin/settings/route.ts\ to prevent these configurations from being stripped and reverting to defaults on save.

- **Ghana GPS Strict Format**: Enhanced the checkout validation layer to strictly enforce the \AS-123-4567\ address format for Ghana GPS postal addresses during checkout.

- **Fixed Ghana Delivery Methods Not Showing in Checkout (`components/checkout/checkout-content.tsx`, `lib/shipping/ghana-delivery-methods.ts`, `app/api/settings/public/route.ts`)**:
  - Resolved checkout bug where Ghana delivery options were missing when Ghana was selected as the delivery country.
  - Enhanced delivery method matching to dynamically resolve country and regional methods with robust fallback to `DEFAULT_GHANA_DELIVERY_METHODS`.
- **Fixed Font Application and Persistence in Appearance Settings (`components/theme/typography-applier.tsx`, `stores/app-settings.ts`)**:
  - Bound dynamic typography stylesheet applier directly to `useAppSettings` store state, ensuring fonts apply instantaneously upon selection and persist reliably across page navigations.
- **Fixed Duplicate Object Key in Public Settings Endpoint (`app/api/settings/public/route.ts`)**:
  - Removed duplicate `appearance` property definition from `/api/settings/public` route response.

## [2026-09-03] — Google 500+ Fonts Engine, Advanced Typography Suite, Admin & POS 3 Layout Stacks, and POS Checkout Pop-up Fix

### Added:
- **Google 500+ Fonts Catalog Engine (`lib/typography/google-fonts-catalog.ts`)**: Built a comprehensive catalog of 514 popular Google Fonts classified across 5 categories (`sans-serif`, `serif`, `display`, `monospace`, `handwriting`) with popularity scores, weight variations (100–900), and dynamic URL generator `buildGoogleFontUrl` with zero layout shift.
- **Dynamic Font Injection & CSS Variable Pipeline (`components/theme/typography-applier.tsx`)**: Developed client-side dynamic stylesheet loader that injects Google Font stylesheets on demand, registers uploaded custom font files as `@font-face` rules, and continuously synchronizes root CSS variables (`--font-heading`, `--font-body`, `--font-mono`, `--font-heading-weight`, `--font-heading-spacing`, `--font-heading-transform`, `--font-heading-color`, `--font-body-color`, `--font-mono-color`). Mounted in root layout (`app/layout.tsx`).
- **Typography & Font Studio Settings Suite (`components/admin/settings/sections/typography-settings-card.tsx`)**: Created complete font management UI in Appearance Settings (`/admin/settings/appearance`) featuring:
  - Searchable Combobox with category tabs across 514 Google Fonts.
  - Role-specific font customization for Headings (`h1-h6`), Body Text, Monospace Codes/SKUs, and Accents.
  - Fine-grained typographic controls: Font Weight (300–900), Letter Spacing (-0.05em to +0.10em), Line Height (1.1 to 1.8), Text Transform (`uppercase`, `lowercase`, `capitalize`, `none`), and custom Hex color pickers.
  - Custom Font Uploader Modal supporting `.woff2`, `.woff`, `.ttf`, and `.otf` font file formats with instant preview and local storage integration.
  - Live Typography Sandbox Preview showing real-time headline typography, body paragraphs, interactive action buttons, and monospace order numbers.
- **Admin & Settings 3 UI Layout Modes**:
  - `cards`: Classic spaced modular card containers with sticky save action footer.
  - `dense`: Enterprise high-density responsive layout with compact form padding, streamlined sidebars, and tight gaps for maximum information throughput.
  - `studio`: Creative Studio full-bleed fluid canvas with glassmorphism backdrop blur (`bg-card/85 backdrop-blur-xl border-primary/25 shadow-xl`), pill navigation, and floating action controls.
  - Added Admin Layout Mode Selector in Appearance Settings and a live Layout Switcher Toolbar in `components/admin/settings/settings-shell.tsx`.
- **POS Terminal 3 Ergonomic UI Layout Modes**:
  - `classic`: Standard Split 2-column layout with product catalog grid, category tabs, quick keys, and running cart ticket.
  - `touch_grocery`: Touch-first Supermarket & Cafe layout with oversized touch targets, integrated 4x4 numeric keypad (Numpad) under the ticket, instant cash tender bill buttons (`Exact`, `+20`, `+50`, `+100`), direct quantity multiplication (`Qty ×`), and 1-tap electronic scale trigger.
  - `scan_compact`: Laser barcode gun-optimized express stream with live barcode scan feed ticker, high-throughput line items, inline rapid steppers, and full-width 1-tap checkout bar (`Instant Cash`, `Card / Tap`).
  - Added POS Default UI Layout selector in POS Settings (`components/admin/settings/sections/pos-settings-tab.tsx`).
  - Added live POS Layout Mode Switcher ribbon directly inside the POS terminal header toolbar (`components/pos/pos-terminal.tsx`).
- **POS Electronic Weight Scale Integration**: Connected `WeightScaleDialog` directly to POS terminal with manual weight triggers and automatic cart item line addition with computed weights and pricing.

### Improvements:
- **Theme Stacks & Typography Persistence Integration**: Integrated typography settings and admin layout preferences into `stores/app-settings.ts`, `models/settings.model.ts`, `app/api/admin/settings/route.ts`, `app/api/settings/public/route.ts`, and `providers/app-settings-provider.tsx` with full database persistence, server-side prefetching, and runtime synchronization.
- **Settings Shell Responsive Canvas**: Enhanced `components/admin/settings/settings-shell.tsx` with dynamic layout mode switching that smoothly transitions sidebar widths, container constraints, and internal grid spacing based on the selected layout mode (`dense`, `studio`, `cards`).
- **POS Terminal Product Grid Responsiveness**: Product grid automatically adapts columns, image aspect ratios, and touch target paddings based on active layout mode (`touch_grocery` vs `scan_compact` vs `classic`).

### Fixes:
- **Dashboard Theme Hydration**: Added \dashboardTemplate\ and \headerButtonStyle\ to the server-side hydration payload in \pp/layout.tsx\ so the dashboard layout correctly persists and renders on load instead of reverting to defaults.

- **Checkout Ghana Delivery Method Layout Bug**: Fixed a bug where the Single-Column list toggle for Ghana Delivery Methods was reverting to the default grid on the storefront. The \checkout\ layout configuration has been properly exposed to the public settings API payload to ensure storefront components can read and render the configured layout preference.

- **Settings API Whitelist**: Added \dashboardTemplate\ and \headerButtonStyle\ to the allowed fields array in \pp/api/admin/settings/route.ts\ to prevent these configurations from being stripped and reverting to defaults on save.

- **Ghana GPS Strict Format**: Enhanced the checkout validation layer to strictly enforce the \AS-123-4567\ address format for Ghana GPS postal addresses during checkout.

- **POS Checkout Pop-up Currency Overlap Bug**: Fixed currency symbol overlap in `components/pos/take-payment-dialog.tsx` where cash tendered amount input was riding over the currency prefix symbol (`GH₵` / `$`). Replaced rigid padding with responsive flex container prefix badge with border separator and tabular font alignment.
- **TypeScript & Import Discrepancies**: Resolved missing `cn` utility in `appearance-settings-tab.tsx` and aligned `POSCartItem` fields for electronic weight scale integration in `components/pos/pos-terminal.tsx`.
- **Compliance Settings Save Button Localization**: Updated `StickySaveFooter` label in `components/admin/settings/sections/compliance-settings-tab.tsx` to reference `t("common.saveSettings")` and added `"saveSettings": "Save Settings"` to `locales/en.json` under `"common"` to ensure uniform, localized button text across administrative settings tabs.

## [Unreleased]
### Added
- **Phase 6A: BOPIS (Buy Online, Pick Up In Store) Fulfillment Hub & Barcode Returns (`/pos/bopis`)**: Standalone click-and-collect fulfillment and returns workstation featuring live pickup queue, 6-digit PIN & QR code verification, recipient digital signature canvas pad, and receipt barcode scanner return engine with damage/regret disposition and automatic inventory restocking.
- **Phase 6B: Electronic Scale Driver & Variable Barcode Decoder**: Web Serial API driver in `lib/pos/weight-scale.ts` for retail electronic scales with continuous weight streaming, tare, and zero commands; in-store price/weight embedded barcode decoder (`lib/pos/weighted-barcode.ts`) decoding GS1/EAN-13 prefixes 02, 20, 21, 22; and modal electronic scale dialog (`components/pos/weight-scale-dialog.tsx`).
- **Phase 6C: Inter-Branch Stock Transfers (IBT) Station (`/pos/transfers`)**: Multi-store stock transfer engine with `models/pos-transfer.model.ts`, `app/api/pos/transfers/route.ts`, and `/pos/transfers` allowing store staff to create outbound transfer manifests, monitor in-transit inventory, and perform physical barcode-scan receiving with automatic discrepancy triage.
- **Phase 6D: POS Live Sales Analytics & Executive Flash Reports (`/pos/reports`)**: Managerial telemetry workstation at `/pos/reports` and `app/api/pos/reports/daily/route.ts` delivering real-time daily revenue KPIs, 24-hour sales velocity bar graph, tender mix breakdown, cashier leaderboard, top-moving products, and 1-click printable thermal flash reports.
- **Phase 6E: POS Sub-Systems Settings & Navigation Expansion**: Added granular configuration switches in POS Settings (`/admin/settings/pos`) for BOPIS Hub, Inter-Branch Transfers, POS Analytics, and Electronic Scales; propagated flags through `models/settings.model.ts`, `/api/settings/public`, and `providers/app-settings-provider.tsx`; and added dynamically filtered navigation links in `components/layout/dashboard-sidebar.tsx`.
- **POS Workstations & Sub-Systems Feature Toggles**: Added granular on/off switches in POS Settings (`/admin/settings/pos`) under a new "POS Sub-Systems & Workstations" card for Kitchen Display System (KDS), Customer Display (CFD), Stock Cycle Counting & Audit, Self-Checkout Kiosk, and Outbox & Sync Manager.
- **POS Workstation Disabled Guard (`components/pos/pos-workstation-disabled.tsx`)**: Reusable glassmorphic screen showing workstation disabled status with direct action buttons to return to the POS register, return to the admin dashboard, or open POS settings.
- **Quick Navigation Headers Across All POS Workstations**: Added dedicated "Back to Register" (`/admin/pos`) and "Back to Dashboard" (`/admin/dashboard`) buttons in the top header and attract screens across all 5 POS sub-applications (`/pos/kds`, `/pos/customer-display`, `/pos/cycle-count`, `/pos/kiosk`, `/pos/sync`).
- **Offline Local IndexedDB Sync & Conflict Resolution Workstation (`/pos/sync`)**: Built a comprehensive standalone workstation and modal drawer (`POSConflictResolutionDialog`) to inspect browser IndexedDB outbox sales, manage pending retries, and resolve inventory discrepancies.
  - **Conflict Inspection & 1-Tap Replay**: Line-item breakdown with customer details, provisional receipt numbers, and exact server rejection reasons (`lastError`).
  - **Manager Override Force-Commit**: Integrated Manager PIN authorization dialog (`/api/pos/override`) to permit authorized oversell and commit stuck offline sales to `/api/pos/orders` with full compliance logging (`recordPOSAuditLog`).
  - **Emergency Ledger Export**: Built client-side JSON export of the offline sales outbox for physical bookkeeping and auditing.
  - **Multi-Tab Workstation**: Dedicated views for Sales Outbox, Offline Customers cache, Audit Trail, and Catalog Snapshot diagnostics with force-refresh capabilities.
- **Self-Checkout Kiosk Mode (`/pos/kiosk`)**: Built an enterprise touch-first self-service checkout experience for retail, boutique, and quick-service venues.
  - **Attract Screen & Screensaver**: Fullscreen animated splash with dynamic store branding that automatically activates on touch or any incoming barcode scan.
  - **Touch-First Self-Scanning Interface**: High-contrast, oversized card catalog with category filters, search input, hardware scanner listener, camera scanning modal (`BarcodeCameraDialog`), and audio chime feedback.
  - **Interactive Cart & Assisted Payment Routing**: Side-by-side active cart with quick +/- quantity adjustments, trash removal, and payment methods (Card/Contactless, on-screen Mobile QR Pay, and Pay at Cashier Desk with printable service barcode slip).
  - **Digital Receipt QR & Inactivity Guard**: Dynamic QR code receipt generation via `qrcode`, automatic order reset countdowns, and a 45-second idle detection warning modal with 15-second countdown.
- **Handheld Stock Cycle Counting & Physical Inventory Audit Workstation**: Built an enterprise inventory auditing station at `/pos/cycle-count` optimized for smartphone PDAs, warehouse tablets, and desktop browsers.
  - **StockAudit Model**: Added `models/stock-audit.model.ts` tracking sequential audit identifiers (`AUD-XXXXXX`), location targeting, physical count items, expected stock, count variances, and financial variance valuation.
  - **Live Camera Barcode Scanner**: Integrated `BarcodeCameraDialog` alongside rapid hardware USB/Bluetooth barcode listeners with audio chime confirmations.
  - **Real-Time Discrepancy KPI Cards**: Live dashboard counters for Total Units Counted, Expected Inventory, Discrepancy Units (+/-), and Net Variance Value ($).
  - **Fast Triage Filtering**: Categorizes audit progress into `All Items`, `Discrepancies`, `Matched`, and `Uncounted` tabs.
  - **Stock Audit API Suite**: Implemented `GET/POST /api/pos/stock-audits`, `GET/PATCH /api/pos/stock-audits/[id]`, and `POST /api/pos/stock-audits/[id]/commit` with location-aware expected stock initialization.
  - **Atomic Inventory Reconciliation**: Automatically applies variance corrections directly to `Product.locationInventory` and global stock pools using `applyStockChangeAtomic`.
- **Secondary Customer-Facing Display (CFD)**: Integrated real-time bidirectional synchronization between the POS Cashier Terminal and dedicated secondary customer monitor at `/pos/customer-display`.
  - **Zero-Latency State Broadcasting**: Live line-item mirroring on every product scan, quantity update, line discount, and subtotal calculation with smooth entrance animations.
  - **Customer Loyalty Recognition**: Displays customer greeting, VIP tier badge, current loyalty point balance, and points earned on the active order.
  - **Touchscreen Customer Tipping**: Integrated interactive tipping selector supporting pre-configured percentage chips, custom tip input modal, and tip removal, with instant callback to the cashier's active checkout balance.
  - **Dynamic Digital Receipt QR Code**: Generates a high-resolution scannable QR code on order completion via `qrcode` for instant mobile receipt download without paper printing.
- **Advanced POS Clienteling & Loyalty Workstation**: Delivered comprehensive customer relationship management and loyalty features directly on the physical register terminal.
  - **Clienteling Drawer**: Created `components/pos/pos-clienteling-drawer.tsx` featuring customer lifetime analytics (lifetime spend, total visits, average order value, last order date), loyalty tier badges (`Bronze`, `Silver`, `Gold`, `Platinum`), 1-tap points redemption against the cart, purchase history with 1-tap re-order, and staff notes/tags editor.
  - **Clienteling API Endpoints**: Created `GET /api/pos/customers/[id]/clienteling` and `PATCH /api/pos/customers/[id]/clienteling` to provide customer history, top product recommendations, and real-time VIP tag updates.
  - **Take Payment Loyalty Integration**: Enhanced `components/pos/take-payment-dialog.tsx` to display real-time points earned on the active order (`calculatePoints(total)`) and prominent badges for points redeemed.
- **Phase 5: Kitchen Display System (KDS) & Order Preparation Station**: Delivered enterprise KDS functionality for food & beverage, bakery, custom assembly, and warehouse packing stations.
  - **KitchenTicket Model**: Added `models/kitchen-ticket.model.ts` with daily sequential ticket numbers, station tagging (`kitchen`, `bar`, `bakery`, `assembly`, `packing`), SLA minutes, order items, modifier notes, and preparation timestamps.
  - **Live KDS Workstation Screen**: Built fullscreen station UI at `/pos/kds` with multi-column card views, dynamic color-coded SLA timers (green, amber, pulsing red), interactive item-level strikethrough checklists, and tactile bump bar controls.
  - **Hardware Bump Bar Shortcuts**: Integrated physical keyboard listener supporting `Space`/`Enter` (advance/bump ticket), `R` (recall last bumped ticket), `1-9` (column focus), `S` (station filter), and `M` (mute audio).
  - **Synthesized Audio Chimes**: Implemented zero-dependency Web Audio API sound alerts in `lib/pos/kds-bridge.ts` for new incoming tickets, overdue warnings, and bump confirmation.
  - **Real-Time Cross-Screen Sync**: Added `BroadcastChannel("eighty7_kds_channel")` bridge for zero-latency multi-screen mirroring across kitchen tablets and packing stations.
  - **KDS API Endpoints**: Created `GET /api/pos/kds/tickets`, `POST /api/pos/kds/tickets`, and `PATCH /api/pos/kds/tickets/[id]` supporting status transitions, item toggles, and ticket recalls.
- **Database Seed Force Flag**: Added `--force` support and `pnpm db:seed:force` script allowing administrators to seed the catalog and demo data without failing snapshot compatibility checks when pre-existing records are present.
- **Backup Upload & Restore UI**: Added the ability to manually upload `.json` backup files directly into the System Management dashboard. Added `restoreSystemBackupFromPayloadAction` to process the uploaded backups securely.
- **File Uploaders in Settings**: Upgraded the receipt settings (logo URL) and AI authoring settings (brand logo URL) from simple text inputs to functional `FileUploadField` components to streamline uploading logos without needing an external image link.

### Improvements
- **Weighted Barcode Scanner & Variable Scale Cart Integration**: Upgraded `components/pos/barcode-scanner-listener.tsx` and `lib/pos/store.ts` to decode in-store scale barcodes (prefixes 02, 20, 21, 22) and automatically calculate custom line prices or weighed quantities in the register cart.
- **Enterprise POS Suite Localization & Zero-Hardcode Mandate**: Extracted all BOPIS, Transfers, POS Reports, and Scale messages, modal descriptions, and button labels into `locales/en.json`. Dynamic currency formatting wired across all new pages via `useCurrency`.
- **POS Workstation Pages Theme UI & Design System Redesign**: Re-engineered all five POS sub-application interfaces (`customer-display`, `cycle-count`, `kiosk`, `sync`, `kds`) to adopt the project's native theme tokens and design system (`bg-background`, `bg-card`, `border-border/60`, `text-foreground`, `text-muted-foreground`, `text-primary`, `rounded-2xl`, `rounded-xl`, `shadow-xs`). Removed all hardcoded slate styles, enabling flawless light mode and dark mode presentation, fluid responsive grids, unified header navigation, and full consistency with the core register terminal.
- **Dynamic Navigation & Sidebar Filtering**: Updated `DashboardSidebar` and `buildPosNavItems` to automatically hide links to disabled workstations when toggled off in POS settings.
- **Public Settings & Context Hydration**: Propagated workstation toggle states through `models/settings.model.ts`, `/api/settings/public`, `providers/app-settings-provider.tsx`, and `components/admin/settings/types.ts`.
- **Zero-Hardcode Mandate**: Extracted all navigation labels, setting descriptions, and disabled screen texts into `locales/en.json`.
- **Next.js Internationalized Route Migration**: Moved all standalone POS sub-applications (`customer-display`, `cycle-count`, `kds`, `kiosk`, `sync`) into `app/[locale]/pos/`. This ensures full compatibility with next-intl middleware and the root layout provider, permanently fixing 404 routing errors on all direct URLs (`/pos/*` and `/[locale]/pos/*`).
- **Offline Sync Internationalization & Zero-Hardcode Compliance**: Created complete `"offlineSync"` dictionary in `locales/en.json` covering banner messages, modal headers, conflict rejection alerts, action buttons, and status toasts. Dynamic currency formatting via `useCurrency`.
- **POS Banner & Terminal Outbox Integration**: Upgraded `components/pos/pos-offline-banner.tsx` with clickable pending/conflict badges and "Outbox & Sync" button opening the resolution drawer directly from the cashier workspace.
- **Dashboard Sidebar Navigation**: Added "Offline Sync & Outbox" link under the Point of Sale menu group in `components/layout/dashboard-sidebar.tsx`.
- **Kiosk Internationalization & Zero-Hardcode Compliance**: Created complete `"kiosk"` dictionary in `locales/en.json` covering all buttons, prompts, errors, and receipt texts; formats currency dynamically using `useCurrency` with zero hardcoded fallbacks.
- **Dashboard Navigation Hierarchy**: Added "Self-Checkout Kiosk" link under Point of Sale menu items in `components/layout/dashboard-sidebar.tsx`.
- **Stock Audit Internationalization & Zero-Hardcode Compliance**: Created complete `"stockAudit"` dictionary in `locales/en.json`, using dynamic currency formatters (`useCurrency`) and eliminating all hardcoded English strings, units, and fallbacks.
- **Dashboard Navigation Hierarchy**: Added "Stock Audit (Cycle Count)" under Point of Sale menu items in `components/layout/dashboard-sidebar.tsx`.
- **POS Terminal Bidirectional CFD Hook**: Wired `broadcastCfdState` and `subscribeToCustomerTips` into `components/pos/pos-terminal.tsx` to automatically stream cart states (`IDLE`, `ACTIVE_TRANSACTION`, `PAYMENT_PENDING`, `ORDER_COMPLETED`) and absorb customer tip selections into the register's active order total.
- **CFD Internationalization & Zero-Hardcode Compliance**: Extracted all customer-facing display labels, welcome messages, tipping prompts, and empty states into the `"cfd"` block in `locales/en.json`, formatting numbers and currency dynamically according to store configuration without hardcoded fallbacks.
- **Comprehensive Internationalization & Hardcode Removal**: Added full `kds` and `clienteling` translation dictionaries to `locales/en.json`. Refactored `KdsBumpBar`, `KdsTicketCard`, `/pos/kds/page.tsx`, and `POSClientelingDrawer` to replace all hardcoded English strings, button text, table/pager prefixes, and empty state labels with dynamic `next-intl` translation keys.
- **Dynamic POS Currency & Catalog Lookup**: Connected the clienteling workstation directly to store-configured default currency (`settings.currency`), replaced hardcoded dummy objects with live product/variant catalog resolution in `onQuickAddToCart`, and dynamically computed loyalty ratios via `lib/pos/loyalty-engine.ts`.
- **POS Customer Header VIP Indicator**: Upgraded selected customer card in the POS register to display live loyalty points balance, loyalty tier badge, and quick access VIP button.
- **POS Automatic Prep Ticket Dispatch**: Updated `app/api/pos/orders/route.ts` to automatically generate preparation tickets for incoming POS transactions with customer names, line modifiers, and daily sequential numbers.
- **Dashboard Navigation Hierarchy**: Added "Kitchen Display (KDS)" and "Customer Display (CFD)" links under the Point of Sale menu group in `dashboard-sidebar.tsx`.
- **Dashboard Sidebar Menu & Submenu Navigation**: Aligned `dashboard-sidebar.tsx` with the clean, reliable click-to-toggle accordion architecture from `Storify-app`. Removed aggressive hover handlers (`onMouseEnter`) and fixed reference instability where unpassed default props reset open sections on every render. Submenus now expand and collapse immediately on user clicks and persist properly across route transitions.
- **POS Catalog Publishing Query**: Updated POS product resolution query (`lib/pos/list-products.ts`) from strict `publishing.pointOfSale: true` to `{ $ne: false }`, allowing active products to sell through the POS terminal without requiring manual re-flagging.
- **POS Workspace Initialization**: Added mount effect in `pos-workspace.tsx` to properly set `hasBooted` to true, restoring multi-cart parking and session hydration.

### Fixes
- **POS Sub-System Settings Persistence Whitelist**: Added `kdsEnabled`, `customerDisplayEnabled`, `stockAuditEnabled`, `kioskEnabled`, `offlineSyncEnabled`, `bopisEnabled`, `transfersEnabled`, `reportsEnabled`, and `scaleEnabled` to `ALLOWED_FIELDS.pos` in `app/api/admin/settings/route.ts`. Fixes the issue where toggling off any workstation switch dropped the field during `validateSectionUpdate` and reset back to `true` upon reload.
- **Multi-Branch & Multi-Vendor Dashboard Navigation & Cache Bypassing**: Added a prominent dedicated "Multi-Branch & Locations" (`admin.sidebar.branches`) navigation section with `Building2` icon to `components/layout/dashboard-sidebar.tsx`. Added `cache: "no-store"` and `_t` timestamp cache-busting to `providers/app-settings-provider.tsx` and wired `onSave` in `multi-branch` and `marketplace` settings pages to call `refreshSettings()`, resolving the issue where multi-branch and multi-vendor menus did not show up immediately upon activation.
- **POS Workstation Camera Scanner Prop Contract Alignment**: Standardized `BarcodeCameraDialog` callback contracts (`onOpenChange` and `onScan`) across all newly introduced workstation interfaces (`bopis`, `transfers`), ensuring camera scanning invokes without prop collision.
- **Admin Settings POS TypeScript Types**: Added `kdsEnabled`, `customerDisplayEnabled`, `stockAuditEnabled`, `kioskEnabled`, and `offlineSyncEnabled` to the `pos` interface in `components/admin/settings/types.ts` to ensure strict TypeScript compile compliance.
- **404 Route Not Found on POS Standalone Sub-Pages**: Resolved 404 errors on `/pos/kds`, `/pos/customer-display`, `/pos/cycle-count`, and `/pos/kiosk` by positioning them under the root `app/[locale]/pos` tree expected by the next-intl proxy middleware.
- **React Compiler Impure Hook Violation in Kiosk**: Fixed `react-hooks/purity` error in `app/[locale]/pos/kiosk/page.tsx` where `Date.now()` was invoked directly in `useRef`, by initializing with `0` and assigning within `useEffect`.
- **Client Bundle Mongoose Isolation**: Extracted pure client-safe loyalty calculation functions and constants (`POINTS_PER_DOLLAR`, `POINTS_REDEMPTION_VALUE`, `calculatePoints`) into `lib/pos/loyalty-constants.ts`. Updated `components/pos/pos-terminal.tsx`, `components/pos/take-payment-dialog.tsx`, and `components/pos/pos-clienteling-drawer.tsx` to import from the client-safe module, preventing Node.js MongoDB/Mongoose dependencies (`timers/promises`, `tls`, `net`) from leaking into the browser compilation bundle.
- **POS Order Loyalty Points Deduction**: Connected `app/api/pos/orders/route.ts` to deduct redeemed loyalty points using `processLoyaltyTransaction` when points are spent at checkout while reliably crediting earned points for completed sales.
- **Next.js Inferred Workspace Root Warning**: Added explicit `outputFileTracingRoot: path.resolve(__dirname)` to `next.config.ts` and cleared the accidental `pnpm-lock.yaml` in the user's home directory (`C:\Users\MrGhouxt\pnpm-lock.yaml`) to permanently eliminate the multiple-lockfile workspace root warning.
- **POS Offline Lock Authorization**: Fixed `canAccessPOS` in `lib/rbac.ts` where `settings.pos.allowAdminSales` and `allowVendorSales` defaulted to undefined, preventing 403 authorization failures on `/api/pos/offline-catalog` that caused registers to enter the "Reconnect to keep selling" lock state.
- **Database Seed Conflict Bypass**: Resolved `assertSnapshotCompatible` failure in `scripts/seed.mjs` by allowing `--force` or `FORCE_SEED=true` when pre-existing vendor records exist in the database.
- **POS v3 Upgrade Phase 4 (Advanced Checkout & Reporting)** - Completed Layaway processing, B2B Net Terms (Trade Credit) at the POS, and End-of-Day Z-Read/X-Read printer reports.
- **POS Z-Read & X-Read Reports**: Added `/api/pos/reports/shift-report` to generate financial shift summaries. Integrated `handlePrintReport` into `pos-shift-dialog.tsx` to automatically print Z-Reports via thermal printer when a shift is closed, and manually print X-Reports mid-shift.
- **POS Layaways & Deposits**: Added `LAYAWAY` order status and a "Put on Layaway" button in the `take-payment-dialog.tsx` that appears when a customer makes a partial payment. Added `/api/pos/layaway/pay` endpoint to securely process subsequent layaway installment payments.
- **POS Trade Credit (B2B)**: Added `trade_credit` as a payment method in the POS checkout dialog. Configured `app/api/pos/orders/route.ts` to validate customer `WholesaleCredit` profiles, deduct available limits in real-time, generate automated invoices, and log the charge in the B2B audit trail during a physical terminal checkout.
- **POS v3 Upgrade Phase 3** - Completed the POS Hardware Integration, Shift Management, and Manager Override features.
- **Hardware Integration** - Implemented a Global Barcode Scanner listener in the POS workspace for rapid item scanning without input focus. Added `Cash Drawer Kick` (ESC/POS over WebUSB) integration directly in `printer.ts` for automatic till opening.
- **Shift Management & Cash Tracking** - Developed `pos-shift.model.ts` and `/api/pos/shift/open|close` endpoints. Added `POSShiftDialog` UI to allow cashiers to open and close register shifts, declaring starting float and ending cash, with automated discrepancy calculation based on sales processed during the shift.
- **Manager Overrides** - Added a `managerPin` field to `StaffProfile`. Integrated a Manager Override prompt in the POS Discount dialog requiring a 6-digit PIN to authorize discounts greater than 10%.
- **POS v3 Upgrade Phase 2** - Comprehensive upgrade to the Point of Sale system, introducing multiple new tabs, split-tender operations, return & exchange handling, and offline-first auto-reconciliation.
- **Store Credit Engine** - The POS can now issue store credit dynamically as Coupons during the return process.
- **Advanced Receipt Builder** - Cashiers and managers can define printed receipt settings (logo, text, tax IDs, digital QR codes) via the newly added `/admin/settings/receipt` UI.
- **Offline Reliability** - Added IndexedDB-backed robust caching for catalog items and `PENDING_ORDERS_STORE`, coupled with auto-sync and replay mechanisms upon coming back online.
- **Split-Tender Checkout** - Ability to process multiple partial payments using distinct methods for the same cart.
- **Quick-Keys Interface** - Added customizable Quick-Key slots to `POSTerminal` for high-velocity items.

### Improvements
- Refactored POS Workspace to use a centralized state model for better handling of multi-cart operations and background persistence.
- Added real-time network liveness indicators and sync badges to the POS terminal.

### Fixes
- Fixed import path for `useCurrency` in POS Returns Dialog.
- Fixed TS layout nesting errors in the POS Terminal (`TooltipProvider` nesting issue).
- Resolved missing type parameters in API inventory restoration logic.

## [2026-09-02] — System Management, Backup/Restore, Sidebar & Mongoose Fixes

### Added:
- **Two-Column Backup & Restore Layout**: Redesigned the System Management backup section into an intuitive two-column layout — "Create Backup" (left, green) with a snapshot stats widget, and "Restore from Backup" (right, amber) with inline restore cards per snapshot file. Snapshot list is scrollable with per-item metadata (filename, timestamp, collections, document count, size badge).
- **Snapshot Stats Widget**: Added a live stats panel in the backup column showing total snapshot count, cumulative size, and timestamp of the latest snapshot.
- **Amber-Styled Restore Buttons**: Restore confirmation dialogs now use amber/warning color scheme to clearly differentiate restore actions from destructive resets.
- **Interactive System Changelog Hub**: Added `getSystemChangelogAction` in `app/actions/system-actions.ts` and an interactive Changelog & Release Timeline explorer in `app/[locale]/admin/system-management/page.tsx` with live search, release version pill tags, category filters (`Added`, `Improvements`, `Fixes`), and raw markdown toggle.
- **Zero-CLI 1-Click System Updater & Schema Migrator**: Added `lib/system/system-updater-service.ts` allowing store administrators to upgrade platform features, execute database migrations, reconcile compound indexes, and refresh runtime caches with a single click in the Admin UI without terminal execution.
- **Native JSON Database Streaming Backup & 1-Click Restore Hub**: Added `lib/system/backup-restore-service.ts` providing host-agnostic, zero-binary database snapshots (`./backups/`) and point-in-time collection restoration with pre-upgrade rollback safeguards.
- **Master POS v3 & System Management Enhancement Blueprint**: Created [POS_AND_SYSTEM_MANAGEMENT_BLUEPRINT.md](file:///c:/Users/MrGhouxt/Desktop/Eighty7Nexus/POS_AND_SYSTEM_MANAGEMENT_BLUEPRINT.md) detailing architecture, offline-first IndexedDB replication, BroadcastChannel dual-screen customer display sync, and hardware driver abstraction.
- **Upgraded System Management Admin Dashboard**: Completely redesigned `app/[locale]/admin/system-management/page.tsx` with 1-Click Update release notes banner, live server & POS telemetry metrics, snapshot table with 1-Click Restore triggers, and compound index reconciler.
- **Phase 7.1 Generative AI Lifestyle Studio**: Added `lib/ai/lifestyle-studio.ts` and `app/api/ai/lifestyle-studio/route.ts` with 6 advertising backdrop presets (Luxury Marble, Scandinavian Minimal, Urban Street, Tropical, Cyberpunk Neon, Studio Podium) powered by prompt synthesis and DALL-E 3.
- **Phase 7.4 B2B Corporate Hierarchy & Multi-Stage Approval Engine**: Added `models/wholesale-company.model.ts`, `lib/wholesale/approval-workflow.ts`, and `app/api/wholesale/approvals/route.ts` for organizational account management (`BUYER`, `PURCHASING_MANAGER`, `FINANCE_DIRECTOR`), spending limits, and multi-tier approval ladders.
- **Phase 7.3 Enterprise Data Warehouse Connectors**: Added `lib/analytics/data-warehouse-sync.ts` and `app/api/admin/analytics/warehouse-sync/route.ts` delivering schema generation (DDL) and streaming JSONL event normalization for Google BigQuery, Snowflake, and PostgreSQL.
- **Phase 7.6 Continuous SOC 2 Type II Security Harvester**: Added `lib/security/soc2-auditor.ts` and `app/api/admin/security/soc2-audit/route.ts` scanning Trust Services Criteria (CC6.1, CC6.6, CC6.8, CC7.2, C1.1, A1.2) and generating automated compliance posture audits.
- **Phase 7.1 Multi-Model LLM Adapter**: Added `lib/ai/llm-provider.ts` and `app/api/ai/completion/route.ts` providing unified AI completion across OpenAI (GPT-4o), Anthropic Claude (Claude 3.5 Sonnet), and self-hosted Ollama local models with automatic fallback.
- **Phase 7.3 Automated Financial Digest Scheduler**: Added `lib/finance/executive-digest-scheduler.ts` and `app/api/cron/finance-digest/route.ts` generating scheduled executive sales, GMV, and margin reports with automated email delivery to store leadership.
- **Phase 7.4 B2B Wholesale Bulk EDI 850 & CSV Order Ingestion**: Added `lib/wholesale/bulk-order-engine.ts` and `app/api/wholesale/bulk-order/route.ts` to parse ANSI X12 EDI 850 purchase orders and CSV spreadsheets with instant inventory validation and tiered volume pricing.
- **Phase 7.5 Real-Time GPS Courier Telemetry & Live Map**: Added `lib/shipping/courier-telemetry.ts`, `components/store/shipping/live-courier-map.tsx`, and `app/api/shipping/courier-telemetry/route.ts` delivering real-time courier tracking maps, speed/heading metrics, and ETA countdowns on customer order tracking pages.
- **Section 7 Database Index Reconciliation Engine**: Added `lib/db/reconcile-indexes.ts` and `app/api/admin/system/reconcile-indexes/route.ts` to audit and synchronize compound indexes across all Mongoose database collections.
- **Phase 7.2 Customer-Facing Display (CFD)**: Implemented standalone secondary kiosk monitor page (`app/(pos)/pos/customer-display/page.tsx`) with zero-latency `BroadcastChannel` real-time sync, interactive customer tipping selector, live itemized cart viewer, and digital QR code receipt download.
- **Phase 7.1 Multimodal Vision AI Studio**: Added `lib/ai/vision-product-extractor.ts` and `app/api/ai/vision-extract/route.ts` for automated 1-click product photography attribute, spec, category, and SEO extraction.
- **Phase 7.1 Next-Gen AI Sales Agent**: Built `lib/ai-sales-agent/sales-agent-rag.ts` featuring vectorized RAG catalog search, real-time customer sentiment scoring, automated human escalation triggers, and dynamic discount bargaining engine.
- **Phase 7.4 B2B Wholesale Trade Credit & Net Terms**: Added `models/wholesale-credit.model.ts`, `lib/wholesale/credit-service.ts`, and `app/api/wholesale/credit/route.ts` supporting credit limits, Net-15/30/60/90 checkout, daily late interest accrual, and 3-stage automated dunning escalations.
- **Phase 7.5 Intelligent Split-Fulfillment**: Built `lib/shipping/split-fulfillment.ts` for multi-warehouse order splitting optimized by geographic haversine proximity and carrier rate efficiency.
- **Phase 7.5 BOPIS Click-and-Collect Handover**: Built `lib/shipping/bopis-handover.ts` and `app/api/shipping/bopis-verify/route.ts` with secure 6-digit PIN and QR verification for in-store order pickups.
- **Phase 7.3 Predictive Demand Sensing & Executive Analytics**: Built `lib/analytics/demand-forecasting.ts`, `lib/finance/executive-reports.ts`, and `app/api/admin/analytics/demand-forecast/route.ts` for automated stockout depletion forecasting, dead-stock alerts, and financial KPI reporting.
- Added `compliance` to `SECTION_ALLOWED_KEYS` and `validSections` in `app/api/admin/settings/route.ts` to allow saving compliance and legal settings.
- Added `compliance` to `objectSections` in `lib/settings/sanitize-settings.ts` and `REQUIRED_OBJECT_SECTIONS` in `components/admin/settings/use-admin-settings.tsx`.
- Added localized translations across all 18 locale files for `admin.settings.compliance` (`title`, `description`, `cookieBanner.title`, `cookieBanner.description`, `cookieBanner.enable`, `cookieBanner.enableDescription`, and layout/content options).

### Improvements:
- **Sidebar Hover Flyout Snappier**: Updated `CollapsedHoverSubmenu` close timer from `300ms` to `120ms` (matching Storify-app reference) for snappier submenu dismissal on icon-collapsed sidebar.
- **Backup Section UI**: Removed legacy table-based backup list in favor of card-based rows with richer metadata display, inline restore action, and separate panel sections.
- **System Management Page Header**: Clarified page title to "System Management" and improved description text.
- Sanitized hardcoded application names and fallback domains:
  - Updated `lib/pos/offline-db.ts` to use dynamic `NEXT_PUBLIC_POS_DB_NAME` environment variable with `eighty7nexus-pos` fallback.
  - Updated `lib/email.ts` to use `noreply@eighty7nexus.com` as canonical platform fallback.
  - Updated `lib/analytics/data-warehouse-sync.ts` to use configurable `BIGQUERY_DATASET` environment variable (`eighty7nexus_warehouse`).
  - Updated `lib/ai/llm-provider.ts` to dynamically resolve `DEFAULT_STORE_NAME` for assistant signatures.
- Upgraded and modernized `ROADMAP.md` with complete architectural breakdown, newly shipped features (Compliance & Legal system, POS v3, Wholesale B2B, 18 locales), chronological Gantt milestones, and technical targets for 2026-2027.
- Refactored `ComplianceSettingsTab` UI to use `Card`, `CardContent`, and theme design system consistent with the rest of admin settings.
- Replaced the basic checkbox tick with a modern `Switch` trigger toggle row (matching the Vendor Configuration tab pattern).

### Fixes:
- **Dashboard Theme Hydration**: Added \dashboardTemplate\ and \headerButtonStyle\ to the server-side hydration payload in \pp/layout.tsx\ so the dashboard layout correctly persists and renders on load instead of reverting to defaults.

- **Checkout Ghana Delivery Method Layout Bug**: Fixed a bug where the Single-Column list toggle for Ghana Delivery Methods was reverting to the default grid on the storefront. The \checkout\ layout configuration has been properly exposed to the public settings API payload to ensure storefront components can read and render the configured layout preference.

- **Settings API Whitelist**: Added \dashboardTemplate\ and \headerButtonStyle\ to the allowed fields array in \pp/api/admin/settings/route.ts\ to prevent these configurations from being stripped and reverting to defaults on save.

- **Ghana GPS Strict Format**: Enhanced the checkout validation layer to strictly enforce the \AS-123-4567\ address format for Ghana GPS postal addresses during checkout.

- **Compliance Settings Save Button Label**: Fixed `t("admin.settings.save")` key which was missing from locale files — replaced with `t("common.saveChanges")` with a safe fallback value "Save Changes".
- **Mongoose Deprecation Warnings** (`[MONGOOSE] Warning: new option is deprecated`): Globally replaced all `{ new: true }` options with `{ returnDocument: 'after' }` across **34 API route files** and **29 service/model files** (63 files total) to silence console warnings and align with Mongoose v8+ API.
- Fixed compliance settings saving error (`ValidationError: Invalid section: compliance`) by registering `compliance` in the settings API endpoint.
- Fixed untranslated `admin.settings.compliance` keys and missing fallback text in the admin settings tab.
- **Package Manager Consistency**: Corrected script usage references and removed erroneous npm references to strictly reinforce `pnpm@10.24.0` as the canonical package manager.

---

## [Unreleased]
### Added
- Added: **System Management Settings Tab**: Moved the System Management dashboard (database backups, restorations, and system health) from its standalone page into the unified Settings panel under the "Advanced" group for a more consolidated admin experience.
- Added: **Clear Application Cache**: Added a new server action and button in the System Management tab that allows administrators to explicitly trigger a Next.js `revalidatePath('/', 'layout')` clearing the frontend cache for all layouts, pages, and API routes.
- Added: **POS v3 Multi-Cart Parking Engine**: Replaced legacy, volatile held orders with a persistent, IndexedDB-backed tabbed interface. Cashiers can now run multiple concurrent customer checkout sessions (tabs) and seamlessly switch between them without losing prices or progress.
- Added: **POS v3 Terminal Controlled State**: Lifted POS terminal state (customer, discount, order notes) into `pos-workspace.tsx` as the single source of truth for the tabbed multi-cart architecture.
- Added: **Redesigned Wholesale Portal**: Completely redesigned the B2B Wholesale page (`/wholesale`) with a premium glassmorphic UI, dynamic hero section, "How it Works" stepper, expanded enterprise features grid (API integration, Freight Logistics, Net Terms), and a dedicated FAQ section.
- Added: **Redesigned Branch Location Page**: Upgraded the Branch Location page (`/branch/[slug]`) to act as a premium physical location directory. Added dynamic image gallery support via `branch.images`, interactive branch amenities grid (In-Store Pickup, Wi-Fi, Accessibility), expanded quick contact cards (Directions, Phone, Email), and a modernized sticky working hours sidebar.
- Added: **Branch Images Support**: Extended the `InventoryLocation` MongoDB schema and TypeScript types to support an `images` array for rendering physical branch photo galleries.

### Fixes
- Fixed: **Chat Widget Minimizing Bug**: Fixed a bug where clicking the chat icon in the floating tab bar (or top bar) multiple times would unexpectedly toggle and minimize the chat. The chat widget now correctly stays open until explicitly dismissed via its own close button.
- Fixed: **System Management Heading Localization**: Updated the System Management settings tab heading to use localized strings (`admin.settings.systemManagement.title`) ensuring consistent visual design with the other setting tabs.
- Fixed: **Dashboard Sidebar Hover Flutter**: Fixed an issue where the collapsed dashboard sidebar submenus would flutter (rapidly open and close) when moving the mouse across the offset gap by increasing the hover intent delay.
- Fixed: **Floating "Back to Top" Icon**: Fixed a bug where the floating "Back to Top" tab icon would disappear when the user scrolled down to the footer section by removing the overlapping visibility check in `useBackToTopVisibility`.
- Fixed: **Duplicative Back to Top Button**: Removed the static "Back to Top" button that was recently added to the `StoreFooter` component to prevent duplicate controls since the floating tab handles this perfectly.

- Added: **Pharmacy Theme**: Built a completely new `Pharmacy` theme with specialized layouts, clinical colors (Teal/Emerald), and pill-shaped aesthetics. Includes new custom section overrides (`pharmacy-category-detail` and `pharmacy-service-benefits`).
- Added: **Pharmacy Product Attributes**: Upgraded the `Product` schema with `PharmacyAttributesSchema` containing fields for `manufactureDate`, `expiryDate`, `batchNumber`, `prescriptionRequired`, `activeIngredients`, and `dosageInstructions`.
- Added: **System Management Dashboard**: Built a new `/admin/system-management` page allowing administrators to view system info, backup the database with `mongodump`, reset the database, and trigger demo seed data import/export natively from the UI using server actions.
- fixes: **Dashboard Sidebar Menus**: Fixed an issue where the top-level parent menus with sub-menus were not clickable, and corrected the internal HTML DOM list structure so nested sub-menus display correctly without rendering as invalid sibling elements.
- fixes: **AI Sales Agent Chat Toggle**: Fixed the floating tab chat icon so it now correctly toggles the AI chat window open and closed on repeated clicks.
- Added: **Back to Top Button**: Added a floating "Back to Top" button to the StoreFooter component, providing users with a quick way to scroll to the top from the footer section.
- Added: **Map to Pickup Locations**: Added a dynamic Google Map iframe directly inside the checkout pickup station selector for customers to visually locate the exact pickup point.
- Added: **Mobile Nav Templates & Customization**: Added curved/glassmorphism templates to `StoreBottomNav` and fully admin-customizable mobile drawer menu builder (with recursive category nested rendering) in the Header Builder settings. Mobile menubar width narrowed and close button increased for better mobile UX.
- Added: **Delivery Method Regions & Cities Setup**: Implemented a fully-featured multi-select dropdown for Regions and Cities inside the Delivery Methods settings to precisely target geographical zones for shipping logistics.
- Improvements: **AI Sales Agent Integration**: Moved the AI Sales Agent chat trigger into the floating tabs UI and removed its independent floating button. Users can now launch the chat from the main floating quick-actions rail, reducing UI clutter.
- Improvements: **AI Sales Agent Positioning**: Upgraded the AI Sales Agent chat box to intelligently anchor itself directly beside whichever floating tab button launched it (horizontally aligned instead of above/below) for a more intuitive, contextual chat experience.
- Improvements: **Checkout Form Polish**: Replaced the Ghana checkout City dropdown with a flexible free-text input and enhanced the Ghana Post GPS input to auto-format dynamically (e.g., auto-appending dashes as the user types `AS-123-1234`).
- Added: **Advanced POS Upgrade - Dynamic Pricing Rules**: Built `PricingRule` model and `pricing-engine.ts` to automatically apply conditional discounts (inventory level, time-of-day, custom segment, bundles). Integrated engine into `usePOSStore` and built `app/[locale]/admin/pos/pricing-rules/page.tsx` for full admin CRUD.
- Added: **Advanced POS Upgrade - Customer Loyalty Program**: Added `loyaltyPoints`, `loyaltyTier`, and `lifetimePoints` to `CustomerProfile`. Built `LoyaltyTransaction` model and `loyalty-engine.ts` with earn/redeem math and threshold tier upgrades. Added a Loyalty Dashboard in the admin panel (`app/[locale]/admin/pos/loyalty/page.tsx`).
- Added: **Advanced POS Upgrade - POS Analytics & Reconciliation**: Created `POS Analytics` dashboard showing 7-day sales velocity, transaction volume, AOV, and a `recharts` breakdown. Created `End of Day Reconciliation` page (`/admin/pos/reconciliation`) allowing cashiers/managers to compare expected system tender against actual cash drawer counts with discrepancy highlighting.
- Added: **Ghana Delivery System UI Integration**: Built `GhanaDeliveryMethodSelector` and `GhanaAddressForm` with native validation for Ghana Post GPS formatting. Automatically surfaces localized delivery methods and fields (`neighbourhood`, `specialRequest`) during checkout when Ghana is selected.
- Added: **Ghana Delivery Methods Admin Configuration**: Built a dedicated `GhanaDeliveryCard` in the shipping settings admin panel (`/admin/settings/shipping`). Allows merchants to create, toggle, and configure custom regional delivery methods (e.g., VIP Transport, STC Cargo) with regional mapping and price tiers.
- Added: **Dynamic Ghana Shipping Methods API Payload**: Whitelisted `ghanaDeliveryMethods` in `app/api/admin/settings/route.ts` ensuring customized delivery routes persist securely inside the `ShippingSettings` schema.
- Added: **Localized Tracking Integration**: Updated `trackingPageUrl` in `lib/shipping/tracking-urls.ts` and `lib/order-shipment-view.ts` to seamlessly intercept and format live tracking links using the custom `trackingUrlTemplate` supplied by Ghana Delivery methods.
- Added: **Wholesale Admin Applications (KYC) CRUD**: Built `/admin/wholesale/applications` with real-time data table and `/api/admin/wholesale/applications` API for reviewing, approving, and rejecting pending wholesale profile applications.
- Added: **B2B Active Accounts CRUD**: Built `/admin/wholesale/customers` with real-time data table and `/api/admin/wholesale/customers` API for managing approved accounts, suspending them, and assigning dedicated B2B Account Representatives.
- Added: **Customer Tiers CRUD**: Built `/admin/wholesale/tiers` and `/api/admin/wholesale/tiers` API to dynamically create, edit, and delete pricing tiers (`WholesaleTier` model). Tiers define default discount percentages, minimum order values, and explicitly toggle whether the tier has Net Terms checkout enabled.
- Added: **Quotes & RFQs CRUD with Auto-Conversion**: Built `/admin/wholesale/quotes` and `/api/admin/wholesale/quotes` API to review quote requests and submit pricing proposals. When a quote is accepted (`status = "accepted"`), it now automatically converts directly into a new `Order` (`paymentMethod: "net_terms"`), drastically speeding up the B2B sales cycle.
- Added: **Credit & Terms Management CRUD**: Built `/admin/wholesale/credit` and `/api/admin/wholesale/credit` API to control credit limits, calculate available/outstanding balances, configure payment terms (e.g. Net 30, Net 60), and enforce Purchase Order (PO) requirements.
- Added: **Dynamic Wholesale Dashboard Data**: Replaced all hardcoded mock text and dummy variables on the customer and admin wholesale dashboards (`/account/wholesale` and `/admin/wholesale`) with real data directly sourced from the database and APIs.
- Added: **Wholesale Dashboard Admin KPI API**: Built new `/api/admin/wholesale/dashboard` endpoint to aggregate and serve live B2B Gross Volume, Active Accounts, Pending Applications, and Credit Extended metrics with a month-over-month trend calculation.
- Added: **Storefront Header Mode & Branch Pills**: Implemented `HeaderModePill` (Retail vs Wholesale) and `BranchSelectorPill` inside the main storefront header, managed by a `Zustand` store and synchronized with cookies for SSR compatibility.
- Added: **Dedicated Front Pages**: Built `app/[locale]/(store)/wholesale/page.tsx` and `app/[locale]/(store)/branch/[slug]/page.tsx` offering customized landing pages that route seamlessly into the main product catalog (`/products`) while inheriting the user's selected mode and branch context.
- Added: **Redesigned Branch Location Page**: Upgraded `app/[locale]/(store)/branch/[slug]/page.tsx` with a premium glassmorphic UI, live dynamic Google Maps embedding via `mapsUrl`, and a reactive weekly Working Hours schedule that highlights the current day's open/close status.
- Added: **Product Admin Wholesale Configuration**: Integrated a new `WholesaleCard` into the main `ProductForm` (`components/admin/product-form.tsx`). This allows merchants to easily toggle B2B wholesale purchasing per product and configure Minimum Order Quantity (MOQ), step quantities, case packs, and master carton dimensions directly from the product creation screen.
- Added: **Auth Cover Image Configuration**: Added `coverImage` upload configuration to the Auth UI Settings in the Admin Appearance tab. The uploaded cover image seamlessly renders on the storefront login/register modal when using Split or Glass themes.

### Improvements
- Improved: **Automated B2B Credit Notifications**: Saving changes in the Credit & Terms dashboard automatically dispatches an email notification to the B2B customer alerting them of their new credit limit or updated payment terms.
- Improved: **Wholesale Dedicated Account Reps**: Appended `accountRepName` and `accountRepEmail` to the `WholesaleProfile` MongoDB schema, allowing stores to assign and display personalized B2B account managers on the customer portal. Fallback logic automatically routes to general B2B support if an individual rep isn't assigned yet.
- Improved: **Global Currency Synchronization**: Overhauled the customer and admin wholesale pages to format all financial figures (credit limits, balances, invoice totals, gross volumes) using the global `useCurrency().formatPrice()` formatter instead of hardcoded dollar (`$`) symbols. This natively respects admin settings and locale preferences without code changes.

### Fixes
- Fixed: **AI Agent Not Opening**: Fixed AI sales agent widget not initializing or opening after being allowed in settings.
- Fixed: **Floating Bar Cutoff**: Fixed floating tabs bar cutting off before the footer section; it now correctly overlaps the footer and copyright sections.
- Fixed: **Ghana Checkout City Dropdown**: Fixed the city dropdown remaining greyed out even after selecting a region in the Ghana checkout address form by correctly populating `availableCities`.
- Fixed: **`Invalid section: wholesale` Error**: Registered `"wholesale"` in the `app/api/admin/settings/route.ts` API validation schema to allow wholesale settings to save properly without validation rejections.
- Fixed: **Wholesale Operating Mode Dropdown Overlap**: Shortened the descriptive option labels inside `wholesale-settings-tab.tsx` to prevent the `<SelectContent>` dropdown from overflowing and clipping into adjacent UI columns on narrower screens.
- Fixed: **Header Mode Toggle Visibility Issue**: Tied the `HeaderModePill` (Retail / Wholesale Switcher) to the global `wholesaleEnabled` state within `store-header.tsx`, ensuring the switch only appears if wholesale capabilities are actually enabled in store settings.
- Fixed: **Dummy Data Leaks**: Prevented the exposure of placeholder variables ("42 active accounts", "$128k gross volume", "Sarah Jenkins") across the admin and account pages.

- Added: **Net Terms / PO Number Checkout Payment Method**: Wholesale buyers with an approved profile (`paymentTerms ≠ prepaid`) now see a "Net Terms (Invoice)" option at checkout. Selecting it reveals an inline PO Number field (monospace input, required for invoice matching). The option is surfaced only after an async `/api/wholesale/eligibility` check — guests and retail customers are unaffected.
- Added: **`/api/wholesale/eligibility` Endpoint**: New `GET` route that checks whether the authenticated user has an approved `WholesaleProfile` with non-prepaid payment terms. Unauthenticated callers receive `netTermsEligible: false` without a 401, making it safe to call fire-and-forget from the public checkout page.
- Added: **B2B "Wholesale Portal" Account Sidebar Section**: Approved wholesale buyers now see a "Business" section in the account sidebar and mobile nav, linking to `/account/wholesale`. The section is conditionally rendered after fetching eligibility and is invisible to retail customers.
- Added: **`wholesaleLinks` export in `account-nav-links.ts`**: New array of wholesale-specific nav links, kept separate from `dashboardLinks` / `settingsLinks` so they can be independently gated.
- Added: **`/api/wholesale/dashboard` Endpoint**: New authenticated `GET` route that retrieves the buyer's `WholesaleProfile` (with populated `WholesaleTier`), credit metrics (`creditLimit`, `availableCredit`, `outstandingBalance`), and open Net Terms invoices from the `Order` collection.
- Added: **Dynamic Wholesale Customer Portal (`/account/wholesale`)**: Replaced static mock data with live `useEffect`-driven API fetch from `/api/wholesale/dashboard`. Includes loading spinner, error boundary, and 1-Click Reorder navigation to `/wholesale/quick-order?reorder=[ORDER_ID]`.

- Added: **Wholesale Admin Management Dashboard**: Created `/admin/wholesale` overview hub, `/admin/wholesale/applications` (KYC application and certificate inspection queue), `/admin/wholesale/tiers` (customer discount tier creator), `/admin/wholesale/quotes` (RFQ management and price negotiation), and `/admin/wholesale/credit` (Net terms and trade credit monitor).
- Added: **B2B Storefront Onboarding & Quick Order Pad**: Built `/wholesale/register` corporate application form with tax ID/certificate uploads and `/wholesale/quick-order` bulk matrix order pad supporting high-speed SKU entry and CSV manifest importing.
- Added: **Wholesale Standalone Admin Settings Tab**: Added `WholesaleSettingsTab` (`/admin/settings/wholesale`) enabling hybrid/gated B2B modes, dual retail/wholesale price display, default credit limits, and Net 15/30/60 term configurations.
- Added: **Interactive Hover-Swap & Unified `/register` Multi-Theme Experience**: Enhanced `/login` and `/register` with seamless hover tabs and click swaps between Sign In and Create Account across all 6 custom auth UI themes (Classic Split, Modern Glass, Dark Luxury, Minimal Clean, Vibrant Gradient, and Professional Corporate) with full settings propagation.
- Added: **Dynamic Multi-Branch Dashboard Sidebar Integration**: Multi-Branch & Locations (`/admin/locations`) dynamically mounts to the admin sidebar navigation when Multi-Branch is activated and cleanly unmounts when deactivated.
- Added: **Multi-Branch & Location Standalone Settings**: Created `MultiBranchSettingsTab` (`/admin/settings/multi-branch`) with trigger toggle and granular operation switches for in-store branch pickup, automatic nearest-branch order routing, inter-branch inventory transfers, and staff branch assignment restrictions.
- Added: **Customer-Paid Paystack Gateway Charges**: Added `passChargesToCustomer` setting to Paystack gateway configuration in Payment Settings (`/admin/settings/payment`), automatically calculating and adding gateway processing charges during checkout when enabled.
- Added: **Offline POS & Multi-Branch Navigation Visibility**: Enhanced dashboard sidebar with direct submenus for **POS Terminal (Register)**, **Staff**, and **Offline POS Settings** (`/admin/settings/pos`), and labeled inventory locations as **Multi-Branch & Locations** (`/admin/locations`) across admin and vendor navigation bars.
- Added: **Auto-Seed Ghana Top Delivery Services in Installation Wizard**: Newly installed stores automatically seed pre-configured delivery services (VIPX Express Parcel, STC Intercity Cargo, Zara Express Zones, Accra/Kumasi local express, Ghana Post EMS, and Nationwide Economy) during the install completion pipeline (`POST /api/install/complete`) and database seed scripts (`seed.mjs` and `seed-delivery-methods.ts`).
- Added: **VIPX & STC Delivery Carrier Presets**: One-click import presets for VIP Jeoun Bus Parcel (`VIPX`) and STC Intercity Logistics (`STC`) with station freight rates and tracking templates.
- Added: **Carrier Logo Upload & Direct URL Support**: Direct image upload via `MediaUploader` and URL input for delivery methods, displayed across the admin data table and checkout selectors.
- Added: **Live Tracking URL Templates & Free Shipping Threshold**: Extended delivery methods with `trackingUrlTemplate` (e.g. `{{trackingNumber}}` substitution) and `freeShippingThreshold`.
- Added: **Search and Carrier Filters** in Delivery Methods admin manager (`/admin/delivery`).
- Added: **Login Page Builder** in `Admin > Online Store > Login Page` with 6 distinct themes (Classic Split, Modern Glass, Dark Luxury, Minimal Clean, Vibrant Gradient, Professional Corporate) with live desktop/mobile preview.
- Added: **Import Ghana Delivery Services** section in `Admin > Delivery Methods` — one-click import of Standard Ghana Logistics Preset (5 routes) and Zara Express Tiered Zones (3 zones).
- Added: `POST /api/admin/delivery-methods/import` API route for bulk-importing preset delivery methods with duplicate-name protection.
- Added: `loginPage` sidebar entry under Online Store in the admin dashboard with `LogIn` icon.
- Added: Modernized Temu-style hover menus for authenticated and guest users in the storefront header.
- Added: Fully functional CRUD Admin UIs for Delivery Methods (`/admin/delivery`) and Pickup Stations (`/admin/pickup-stations`).
- Added: `ModernAuthPopup` component to gracefully handle popup-based login and registration flows without redirects.
- Added: CheckoutSettingsTab with Ghana localized delivery settings.
- Added: Link to Ghana Delivery in shipping-settings-tab.tsx.
- Added: Configurable Floating Tabs & Category Tabs orchestrator for storefronts mimicking major marketplace UI styles (Temu, Alibaba, AliExpress). Includes AI assistant support and Back-To-Top features.
- Added: Four new distinct Product Card UI display styles in the store builder (Temu Style, Alibaba Style, Elegant Luxury, Dense Compact).
- Added: "Item sold" and "Variant count" options enabled in the Product Detail UI page builder layout.
- Added: Dual display of Country selector flag alongside Currency switcher in the main header across all responsive breakpoints.
- Added: `dynamic` product page style variant ("Dynamic Interactive") supporting animations and hover styles to the Product Page Builder.
- Added: Configurable Developer Credit section in the Footer Settings with options to enable, set text, and add links.
- Added: 4 new Footer Layout template styles (grid, split, compact, mega) for more versatile design choices.
- Added: Footer UI Builder in Admin Dashboard with live preview, supporting up to 8 link columns, dynamic widgets, and developer credit configuration.
- Added: 2 new Header Layout template styles (minimal-center, modern-split).
- Added: Product Page template configurations and schema supporting 5 new layout styles (standard, gallery, sticky-sidebar, full-width, minimal).
- Added: Full UI Interface for the Admin Dashboard Product Page Builder enabling dynamic toggling of layouts and settings.
- Added: Universal image upload field allowing both media library uploads and direct external links.
- Added: Product Page front store menu integration.
- Added: Product delivery information settings globally configured and displayed on product pages.
- Added: Footer layouts/templates system with variants (`classic`, `centered`, `minimal`, `columns`) configurable in the admin dashboard.
- Added comprehensive OTP configuration via SMS and Email for Customer, Vendor, and Admin authentication.
- Added multiple SMS provider integrations (Twilio, MessageBird) including native Ghanaian gateways (Hubtel, Arkesel).
- Added auto country detection capabilities based on user IP geography.
- Added real-time currency conversion dynamically applied across the storefront.
- Added support for multiple payment method icon/image uploads (like Temu) in the Footer builder, with an option to toggle display on product pages.
- Added a WhatsApp notification service layer supporting Meta, Twilio, and MessageBird APIs for automated order lifecycle updates.
- Added a WhatsApp integration configuration tab to the admin settings panel for managing API credentials and templates.
- Added custom model provider settings (Base URL, API Key) in the AI Sales Agent for Ollama and other OpenAI-compatible endpoints.
- Added interactive currency selector dropdown to the storefront desktop and mobile headers, populated from supported currencies.
- Added testing infrastructure using `vitest` and `@testing-library/react`.
- Added Ghana currency (`GHS`) with symbol `GH₵`, locale `en-GH`, and custom formatting override across currency constants and formatters.
- Added searchable timezone dropdown picker (`TIMEZONE_OPTIONS`) in `lib/timezones.ts` supporting standard IANA timezones and offsets.
- Added Ghana dialing code (`+233`) to the top of shortlisted phone codes in `lib/phone-codes.ts`.
- Added all 16 Ghana administrative regions to country/region mapping options in `lib/country-options.ts`.
- Added: Customized HTML Order Confirmation Emails displaying conditional layout details depending on delivery mode vs pickup mode selected by the user.
- Added: Mongoose schemas representing delivery methods (`DeliveryMethod`) and pickup stations (`PickupStation`).
- Added: Robust Zustand state management across the checkout flow.
- Added: Move Up/Move Down controls for Floating Tabs items in the admin settings to resolve reordering issues.
- Added: Explicit "Enable" toggle for the Footer Bottom Bar in the Admin Footer Builder to ensure configuration persists correctly.
- Added: Configurable `soldCount` field to the Product schema to persistently track and display items sold.
- Added: Storefront Product Page UI elements for "Item Sold" and "Variant Count", matching the aesthetic of the 4 new storefront product card designs (Temu, Alibaba, etc.).
- Implemented grouped multi-item Floating Tabs for the storefront, matching AliExpress, Temu, and Alibaba aesthetics.
- Added: Universal Footer Block Builder enabling custom grid layouts and modular widget placement directly from the Admin Settings.
- Added: **WhatsApp Order & Preorder Notifications for Customers**: Implemented automated WhatsApp message dispatches for order confirmation, shipping updates, delivery status, and pre-order updates via Meta Graph API, Twilio, and MessageBird.
- Added: **3 New Footer Templates**: Added `modern-card` (Modern Floating Card), `newsletter-hero` (Newsletter Hero Banner), and `glassmorphic-dock` (Glassmorphic Floating Dock) to `FOOTER_STYLE_VARIANTS`, settings normalizer, and `FooterBuilder`.
- Added: **Login Page & Auth UI Customizer**: Rebuilt `/login` page with options to add custom logo, page background image, split-view side hero banner, customizable headings, social login toggle (Google/Facebook), passwordless OTP toggle, button and glow colors, card position, and border radius.
- Added: **6 Distinct Login & Auth Modal UI Themes**: Added support for 6 full theme styles across the `/login` page and the `ModernAuthPopup` modal (`classic-split`, `modern-glass`, `dark-luxury`, `minimal-clean`, `vibrant-gradient`, and `professional-corporate`).
- Added: **POS Offline Audit Trail & Compliance Logging**: Added `AUDIT_LOG_STORE` in `lib/pos/offline-db.ts` (`recordPOSAuditLog`, `getRecentPOSAuditLogs`) to securely capture cashier transactions, line discount overrides, voids, and sync events with local IndexedDB persistence for PCI/GDPR compliance.
- Added: **Two-Way Offline POS Synchronization**: Enhanced `syncOutbox` in `lib/pos/offline-sync.ts` to automatically drain pending offline customer creations and reconcile temporary local IDs before replaying offline sales upon network reconnection.
- Added: **Offline POS Customer Database & Lookup**: Integrated local IndexedDB customer caching and fallback searching (`saveOfflineCustomers`, `searchOfflineCustomers`), enabling instant customer lookup and local offline customer profile creation during network outages.
- Added: **Offline POS Analytics Engine**: Added local analytics aggregations (`recordOfflineSaleAnalytics`, `getLocalAnalytics`) in IndexedDB, tracking daily offline revenue, ticket sizes, and payment method statistics per POS terminal.
- Added: **Multi-Branch Top Bar Header Button**: Dynamically rendered Multi-Branch action button with GitBranch icon in `AdminHeader` beside POS and Explore Website, active only when Multi-Branch is enabled.
- Added: **Delivery Methods Integration in Storefront Checkout**: Synchronized database `DeliveryMethod` records (VIPX, STC, Zara Express, Accra Metro, etc.) into `resolveCheckoutShipping` so active delivery methods appear directly as checkout shipping options.
- Added: **Pickup Stations Checkout Availability**: Connected `PickupStation` documents and physical store branches to `pickupLocationsForVendor` allowing customers to choose pickup stations seamlessly at checkout.
- Added: **Username / Name Sign-in**: Enabled customers and users to log in with either their name or email address seamlessly via `/api/auth/resolve-identifier` and updated `LoginSchema`.
- Added: **Ghana Locations Static Fallback**: Provided zero-latency in-memory dataset of all 16 Ghana regions and districts in `lib/data/ghana-locations.ts` preventing empty or greyed-out address dropdowns.

### Improvements
- Improved: **`CheckoutFormData` Extended for Net Terms**: Added `net_terms` to the `paymentMethod` union type and added `poNumber?: string` field in `checkout-helpers.tsx`, keeping the shared checkout type contract in sync with both UI and server expectations.
- Improved: **`paymentConfig` State Includes `netTermsEnabled`**: Extended the `paymentConfig` state shape in `checkout-content.tsx` with `netTermsEnabled: boolean` (default `false`). The flag is toggled asynchronously from the eligibility API without blocking the main settings load, so checkout page performance is unaffected.
- Improved: **Checkout Payment Zod Schema Includes `net_terms` + `poNumber`**: The inline checkout validation schema now accepts `net_terms` in the payment method enum and an optional `poNumber` string field, enabling server-side PO number capture through the existing checkout submission pipeline.

- Improved: **Header Action Label Updated to "Visit Website"**: Changed the storefront preview button text in `AdminHeader` from "Browse Website" to "Visit Website" across localization files.
- Improved: **Ghana Address Form Sequential Layout**: Re-arranged Ghana address checkout form to the exact requested structure: Country (Ghana), Region, City / Town, Town (District / Municipality), Ghana Post GPS, Street Address / House No., and Additional Information / Landmark box (Optional).
- Improved: **Town / Suburb Address Integration for Ghana**: Added `town` to `Address` interface, `AddressSchema`, `CheckoutAddressSchema`, `CheckoutFormData`, and `buildCheckoutAddressPayload` ensuring granular town/suburb specifications are captured, persisted, and submitted with checkout payloads.
- Improved: **Multi-Branch Dynamic Toggle**: Multi-Branch button is dynamically enabled when turned on in settings and disabled/hidden when turned off.
- Improved: **Ghana Post GPS Auto-Formatting**: Added strict live input masking (`XX-123-1234` format) in `GhanaAddressForm` formatting Ghana Post GPS codes automatically as the user types.

### Fixes
- Fixed: **Server Error (500) and Access on `/admin/delivery` and `/admin/pickup-stations`**: Aligned page-level guards to standard `requireAdminOrStaffPageAccess({ locale, required: [STAFF_PERMISSIONS.VIEW_ORDERS] })` ensuring authorized access without triggering unhandled redirects or server component boundary crashes.
- Fixed: **`prefer-const` Lint Error in `lib/pricing/wholesale.ts`**: Changed `let appliedTierName` to `const` on line 51 — the variable is only written once during initialization, satisfying the ESLint `prefer-const` rule and removing the sole lint error blocking CI.
- Fixed: **Delivery Zone Creation and Presets Import Feedback**: Added error body parsing and toast notifications to `DeliveryMethodDialog` and preset import buttons, ensuring clear status reports when creating zone-based methods or importing Ghana delivery presets.
- Fixed: **Storefront Footer Rendering for Newly Added Templates**: Integrated live storefront rendering handlers (`renderModernCard`, `renderNewsletterHero`, `renderGlassmorphicDock`) in `StoreFooter` (`components/layout/store-footer.tsx`) so selecting any of the 3 new footer designs displays immediately on the live storefront.
- Fixed: **SMS, OTP & WhatsApp Configuration Persistence**: Added `sms`, `otp`, and `whatsapp` to `objectSections` in `sanitizeSettings` and registered provider secrets in `CREDENTIAL_FIELD_PATHS` so that SMS/OTP settings and credentials save properly without unintended deactivation triggers or loss of state.
- Fixed: **Missing Town Field on Ghana Address Forms**: Bound `town` to the input field in `GhanaAddressForm` and synchronized with the checkout schema and submission payload.
- Fixed: **`Invalid section: multiBranch` in Settings API**: Whitelisted `"multiBranch"` section in `app/api/admin/settings/route.ts` PUT handler to allow saving multi-branch settings without validation errors.
- Fixed: **Checkout Delivery Methods Not Quoted**: Resolved delivery methods query in `lib/checkout-shipping.ts` so custom and imported delivery carriers appear as selectable rates during checkout.
- Fixed: **Checkout Pickup Stations Not Available**: Resolved pickup stations alongside inventory locations in `lib/pickup-locations.ts` so customers can select local pickup stations.
- Fixed: **Checkout District Dropdown Greyed Out**: Synchronized region selection with instant in-memory district mapping in `GhanaAddressForm`, eliminating loading freeze when choosing a region.
- Fixed: **Duplicate Mongoose Schema Indexes**: Removed duplicate index declarations on `GhanaRegionSchema` (`name`, `code`) and `POSTransactionSchema` (`idempotencyKey`).
- Fixed: **Next.js Unsupported Metadata Viewport Warning**: Moved `themeColor` and `viewport` into separate `Viewport` export in `app/(pos)/layout.tsx`.
- Fixed: **Add to Cart & Buy Now Errors on Fashion Theme & Product Pages**: Corrected validation schema in `OptionalObjectIdSchema` (`lib/validations/index.ts`) to gracefully transform empty strings and nulls into `undefined`, sanitized variant and product IDs in `useCart.addItem` (`hooks/use-cart.tsx`), and surfaced specific backend validation error messages across `ProductDetails`, `ModernProductCard`, and `ProductQuickViewModal`.
- Fixed: **Delivery Presets Import Feedback & Deduplication Message**: Improved `POST /api/admin/delivery-methods/import` and `handleImport` in `DeliveryAdminContent` to provide clear feedback when presets are already imported or newly added without throwing false errors.
- Fixed: **Server Error (500) on `/admin/delivery` and `/admin/pickup-stations`** — converted both client-only pages to proper server-component wrappers calling `setRequestLocale` (required by next-intl for each `[locale]` segment page) while delegating CRUD interactivity to extracted client components.
- Fixed: 404 Not Found error on Delivery Methods and Pickup Stations by properly migrating `app/(admin)` routes to the correct `app/[locale]/admin` dynamic segment.
- Fixed: Pickup Stations CSV Import failing with "missing headers" by stripping the hidden BOM character during header parsing.
- Fixed: Developer credit "Powered by Eighty7Nexus" appearing in the storefront footer by completely removing the developer credit layout block.
- Fixed: Assorted typechecking issues in the WebUSB printer util, the PWA service worker, and the orphaned Next.js build cache.
- Fixed Typescript errors related to order confirmation and fulfillment address.
- Fixed ESLint purity error in barcode-scanner listener.
- Fixed: Footer Copyright (Bottom Bar) reverting to 2 columns after save by strictly mapping and validating the `columns` array in `lib/footer-config.ts` to prevent serialization stripping.
- Fixed: Footer Bottom Bar column alignment (Left/Center/Right) not applying to the storefront nodes (Brand, Copyright, Developer Credit) by removing conflicting hardcoded layout utilities.
- Fixed: Storefront Mega Menu and category list dropdowns appearing underneath hero slider images by elevating the header popover `z-index` to `z-[100]`.
- Fixed: Product UI styles (like Item Sold and Variant Count) not reflecting on the Product Detail Page by properly reading the storefront `visibility` configuration on the Product Page.
- Fixed `Invalid section: onlineStore` by registering the correct schema keys in the admin settings API.
- Fixed: Settings validation failed for `styleVariant` in Floating Tabs by adding the missing new styles (`glass-panel`, `modern-glow`, etc.) to the Mongoose schema enum.
- Fixed: Floating tab items could not be moved by implementing explicit reorder buttons.
- Fixed: Bottom Bar Layout not showing after saving by correcting state persistence in the `FooterBottomBarBuilder`.
- Fixed: Copyright section / bottom bar disappearing after applying columns because the settings normalizer was incorrectly stripping the `bottomBar` and `sections` payload on save.
- Fixed: 404 Page Not Found error when saving general settings (like Currency) by correcting the locale redirect logic when `hideDefaultLocalePrefix` is enabled.
- Fixed country and currency dropdown not showing on frontend.
- Removed Israel from the blocked countries list and codebase per user request.

### Added
- Added: Configurable Floating Tabs & Category Tabs orchestrator for storefronts mimicking major marketplace UI styles (Temu, Alibaba, AliExpress). Includes AI assistant support and Back-To-Top features.
- Added: Four new distinct Product Card UI display styles in the store builder (Temu Style, Alibaba Style, Elegant Luxury, Dense Compact).
- Added: "Item sold" and "Variant count" options enabled in the Product Detail UI page builder layout.
- Added: Dual display of Country selector flag alongside Currency switcher in the main header across all responsive breakpoints.
- Added: `dynamic` product page style variant ("Dynamic Interactive") supporting animations and hover styles to the Product Page Builder.
- Added: Configurable Developer Credit section in the Footer Settings with options to enable, set text, and add links.
- Added: 4 new Footer Layout template styles (grid, split, compact, mega) for more versatile design choices.
- Added: Footer UI Builder in Admin Dashboard with live preview, supporting up to 8 link columns, dynamic widgets, and developer credit configuration.
- Added: 2 new Header Layout template styles (minimal-center, modern-split).
- Added: Product Page template configurations and schema supporting 5 new layout styles (standard, gallery, sticky-sidebar, full-width, minimal).
- Added: Full UI Interface for the Admin Dashboard Product Page Builder enabling dynamic toggling of layouts and settings.
- Added: Universal image upload field allowing both media library uploads and direct external links.
- Added: Product Page front store menu integration.
- Added: Product delivery information settings globally configured and displayed on product pages.
- Added: Footer layouts/templates system with variants (`classic`, `centered`, `minimal`, `columns`) configurable in the admin dashboard.
- Added comprehensive OTP configuration via SMS and Email for Customer, Vendor, and Admin authentication.
- Added multiple SMS provider integrations (Twilio, MessageBird) including native Ghanaian gateways (Hubtel, Arkesel).
- Added auto country detection capabilities based on user IP geography.
- Added real-time currency conversion dynamically applied across the storefront.
- Added support for multiple payment method icon/image uploads (like Temu) in the Footer builder, with an option to toggle display on product pages.
- Removed duplicate payment icons section from Appearance settings to consolidate into Footer settings.
- Fixed issue where the default language prefix was not hiding correctly when configured by the admin.
- Fixed the missing supported languages in the admin dashboard by dynamically reading the locales list from the i18n configuration instead of a hardcoded array.
- Fixed an issue where the Live Exchange Rates configuration (`exchangeRateApiKey`, `exchangeRateProvider`) and `hideDefaultLocalePrefix` were being cleared upon saving in the admin settings API.
- Fixed `build` and `typecheck` compilation errors related to incorrect import paths for `MediaUploader` and malformed `buildEmailShell` properties in authentication flows.
- Added a WhatsApp notification service layer supporting Meta, Twilio, and MessageBird APIs for automated order lifecycle updates.
- Added a WhatsApp integration configuration tab to the admin settings panel for managing API credentials and templates.
- Added custom model provider settings (Base URL, API Key) in the AI Sales Agent for Ollama and other OpenAI-compatible endpoints.
- Added interactive currency selector dropdown to the storefront desktop and mobile headers, populated from supported currencies.
- Added testing infrastructure using `vitest` and `@testing-library/react`.
- Added Ghana currency (`GHS`) with symbol `GH₵`, locale `en-GH`, and custom formatting override across currency constants and formatters.
- Added searchable timezone dropdown picker (`TIMEZONE_OPTIONS`) in `lib/timezones.ts` supporting standard IANA timezones and offsets.
- Added Ghana dialing code (`+233`) to the top of shortlisted phone codes in `lib/phone-codes.ts`.
- Added all 16 Ghana administrative regions (Ahafo, Ashanti, Bono, Bono East, Central, Eastern, Greater Accra, North East, Northern, Oti, Savannah, Upper East, Upper West, Volta, Western North, Western) to country/region mapping options in `lib/country-options.ts`.

### Fixes
- Fixed: "Invalid section: whatsapp", "Invalid section: otp", and "Could not save product page settings" errors by properly registering and allowing `whatsapp`, `otp`, `sms`, and `productPages` keys in the settings API route validation.
- Fixed the admin settings sidebar incorrectly sticking the active background on "General Settings" when navigating to other tabs if the default locale prefix was hidden.
- Fixed the navigation hub URLs appending the `en/` default locale prefix when hovering on the cards.
- Fixed missing translation keys for `admin.settings.storage.local` and `admin.settings.storage.localDesc` in English locale.
- Fixed TypeScript type mismatches in WhatsApp settings (`twilioFromNumber` and `deliveryUpdate`).
- Fixed type issues with `StorageProvider` by re-enabling `"local"` in the enum for legacy filesystem support and resolving missing credentials in Storage settings panel.
- Fixed `UploadResult` type mismatch in `legacy-local.ts` by explicitly providing `size` and `contentType` properties.

### Changed
- Persisted conversation history for the AI Sales Agent chat widget using `localStorage` to allow seamless sessions.
- Rebranded application from `Storify` to `Eighty7Nexus` across app configurations, metadata defaults, seed scripts, seed data, and package metadata.
- Updated all email addresses and store domain references to `@eightyseventech.com` and `www.eightyseventech.com`.
- Updated seed and fallback contact addresses and phone numbers to Ghana location format (e.g. `14 Cantonments Road, Accra, Greater Accra, Ghana` and `+233 24 555 0100`).
- Updated default store currency to Ghanaian Cedi (`GHS` with `GH₵` symbol) and default system timezone to `GMT`.
- Replaced plain text timezone input in general settings and live chat settings with the searchable timezone selector with `GMT` as default.
- Updated default theme colors across branding configs, settings models, store defaults, and seed data to Primary: `#001a45`, Secondary: `#324071`, and Accent: `#77CDCC`.

### Fixed
- Fixed `build` script failing on Windows by adding `cross-env` dependency to correctly parse the inline `NODE_OPTIONS` environment variable.
- Fixed missing module error (`ERR_MODULE_NOT_FOUND`) during build by installing `@epic-web/invariant`.
- Fixed pnpm unexpected virtual store location error by cleaning up `node_modules` and performing a fresh installation.
- Removed all references to Israel (`IL`, `+972`) across country, currency, and phone codes mappings.

## [Unreleased]
### Added:
- Multi-Branch Mode toggle in General Settings.
- Storefront Branch Locator (/branches) and dedicated branch pages (/branches/[slug]) to view local inventory.
- Admin branch management interface (/admin/branches).
- Staff members can be restricted to specific branches via ssignedBranches property.
- Orders now record ranchId for local pickups.
### Improvements:
- InventoryLocation model repurposed as a comprehensive Branch model with address and contact fields.
- Checkout inventory deductions gracefully respect the specific branch assignment for pickup fulfillments.
### Fixes:
- **Dashboard Theme Hydration**: Added \dashboardTemplate\ and \headerButtonStyle\ to the server-side hydration payload in \pp/layout.tsx\ so the dashboard layout correctly persists and renders on load instead of reverting to defaults.

- **Checkout Ghana Delivery Method Layout Bug**: Fixed a bug where the Single-Column list toggle for Ghana Delivery Methods was reverting to the default grid on the storefront. The \checkout\ layout configuration has been properly exposed to the public settings API payload to ensure storefront components can read and render the configured layout preference.

- **Settings API Whitelist**: Added \dashboardTemplate\ and \headerButtonStyle\ to the allowed fields array in \pp/api/admin/settings/route.ts\ to prevent these configurations from being stripped and reverting to defaults on save.

- **Ghana GPS Strict Format**: Enhanced the checkout validation layer to strictly enforce the \AS-123-4567\ address format for Ghana GPS postal addresses during checkout.

- N/A






