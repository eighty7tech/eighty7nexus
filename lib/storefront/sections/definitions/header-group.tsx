import { AnnouncementBar } from "@/components/store/sections/announcement-bar";
import {
  HeaderBar,
  FooterBar,
  getHeaderUtilityLinks,
} from "@/components/store/sections/header-chrome";
import { TopTags } from "@/components/store/sections/top-tags";
import { lt } from "../localized";
import type { LocalizedText, SectionDefinition } from "../types";

/**
 * The header/footer GROUP sections (P8). The bars are locked cores whose
 * bodies stay with the classic header/footer settings forms — the group
 * document decides what renders AROUND them: the announcement bar above,
 * the top-tags strip below, and whatever joins them later.
 */

export const headerBar: SectionDefinition = {
  type: "header-bar",
  version: 1,
  category: "more",
  zones: ["header"],
  required: true,
  locked: true,
  maxPerPage: 1,
  fields: [],
  Render({ ctx }) {
    return <HeaderBar locale={ctx.locale} />;
  },
};

export const footerBar: SectionDefinition = {
  type: "footer-bar",
  version: 1,
  category: "more",
  zones: ["footer"],
  required: true,
  locked: true,
  maxPerPage: 1,
  fields: [],
  Render({ ctx }) {
    return <FooterBar locale={ctx.locale} />;
  },
};

export const announcementBar: SectionDefinition = {
  type: "announcement-bar",
  version: 1,
  category: "promotions",
  zones: ["header"],
  maxPerPage: 1,
  fields: [
    { key: "text", type: "text", translatable: true, default: "" },
    { key: "url", type: "url", default: "" },
    // Empty means the theme's primary scheme — no hardcoded brand color.
    { key: "backgroundColor", type: "color", default: "" },
    { key: "textColor", type: "color", default: "" },
  ],
  Render({ settings, ctx }) {
    return (
      <AnnouncementBar
        locale={ctx.locale}
        text={lt(
          settings.text as LocalizedText,
          ctx.locale,
          ctx.defaultLanguage,
        )}
        href={(settings.url as string) ?? ""}
        backgroundColor={(settings.backgroundColor as string) ?? ""}
        textColor={(settings.textColor as string) ?? ""}
      />
    );
  },
};

export const topTags: SectionDefinition = {
  type: "top-tags",
  version: 1,
  category: "content",
  zones: ["header"],
  maxPerPage: 1,
  fields: [],
  blocks: [
    {
      type: "tag",
      max: 12,
      fields: [
        { key: "label", type: "text", translatable: true, default: "" },
        { key: "url", type: "url", default: "" },
      ],
    },
  ],
  starter: { blocks: [{ type: "tag" }, { type: "tag" }, { type: "tag" }] },
  async Render({ blocks, ctx }) {
    // Empty unless Header Studio parks the utility links on this row.
    const utilityLinks = await getHeaderUtilityLinks(ctx.locale);
    return (
      <TopTags
        locale={ctx.locale}
        utilityLinks={utilityLinks}
        tags={blocks
          .filter((block) => block.visible)
          .map((block) => ({
            id: block.id,
            label: lt(
              block.settings.label as LocalizedText,
              ctx.locale,
              ctx.defaultLanguage,
            ),
            href: (block.settings.url as string) ?? "",
          }))}
      />
    );
  },
};
