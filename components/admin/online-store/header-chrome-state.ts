import type {
  BlockInstance,
  SectionInstance,
} from "@/lib/storefront/sections/types";
import type { LocalizedText } from "@/lib/storefront/sections/types";
import { lt } from "@/lib/storefront/sections/localized";

/**
 * The announcement bar and top tags are section instances on the header
 * GROUP document (that's what keeps them theme-preset-able and per-locale),
 * but the header editor surfaces them as plain settings. These helpers are
 * that bridge: read the instances into flat editor state, write editor
 * changes back into the sections array without disturbing anything else on
 * the document.
 */

export const MAX_TOP_TAGS = 12;

export interface AnnouncementDraft {
  enabled: boolean;
  text: string;
  url: string;
  backgroundColor: string;
  textColor: string;
}

export interface TopTagDraft {
  id: string;
  label: string;
  url: string;
}

export interface TopTagsDraft {
  enabled: boolean;
  tags: TopTagDraft[];
}

function findSection(sections: SectionInstance[], type: string) {
  return sections.find((section) => section.type === type);
}

/**
 * Write a translatable field: plain strings stay plain, per-locale records
 * keep their other translations and take the new copy on the admin default
 * language.
 */
function setLocalized(
  existing: unknown,
  language: string,
  value: string,
): LocalizedText {
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return { ...(existing as Record<string, string>), [language]: value };
  }
  return value;
}

export function readAnnouncement(
  sections: SectionInstance[],
  language: string,
): AnnouncementDraft {
  const section = findSection(sections, "announcement-bar");
  const settings = section?.settings ?? {};
  return {
    enabled: Boolean(section && section.visible),
    text: lt(settings.text as LocalizedText, language, language),
    url: typeof settings.url === "string" ? settings.url : "",
    backgroundColor:
      typeof settings.backgroundColor === "string"
        ? settings.backgroundColor
        : "",
    textColor:
      typeof settings.textColor === "string" ? settings.textColor : "",
  };
}

export function writeAnnouncement(
  sections: SectionInstance[],
  draft: AnnouncementDraft,
  language: string,
): SectionInstance[] {
  const existing = findSection(sections, "announcement-bar");

  if (!existing) {
    if (!draft.enabled) return sections;
    // Above the header bar, where the storefront renders it.
    const instance: SectionInstance = {
      id: crypto.randomUUID(),
      type: "announcement-bar",
      version: 1,
      visible: true,
      settings: {
        text: draft.text,
        url: draft.url,
        backgroundColor: draft.backgroundColor,
        textColor: draft.textColor,
      },
    };
    return [instance, ...sections];
  }

  return sections.map((section) =>
    section === existing
      ? {
          ...section,
          visible: draft.enabled,
          settings: {
            ...section.settings,
            text: setLocalized(section.settings.text, language, draft.text),
            url: draft.url,
            backgroundColor: draft.backgroundColor,
            textColor: draft.textColor,
          },
        }
      : section,
  );
}

export function readTopTags(
  sections: SectionInstance[],
  language: string,
): TopTagsDraft {
  const section = findSection(sections, "top-tags");
  return {
    enabled: Boolean(section && section.visible),
    tags: (section?.blocks ?? [])
      .filter((block) => block.type === "tag")
      .map((block) => ({
        id: block.id,
        label: lt(block.settings.label as LocalizedText, language, language),
        url:
          typeof block.settings.url === "string"
            ? (block.settings.url as string)
            : "",
      })),
  };
}

export function writeTopTags(
  sections: SectionInstance[],
  draft: TopTagsDraft,
  language: string,
): SectionInstance[] {
  const existing = findSection(sections, "top-tags");
  const cappedTags = draft.tags.slice(0, MAX_TOP_TAGS);

  const buildBlocks = (previous: BlockInstance[]): BlockInstance[] => {
    const byId = new Map(previous.map((block) => [block.id, block]));
    return cappedTags.map((tag) => {
      const prior = byId.get(tag.id);
      return {
        id: tag.id,
        type: "tag",
        visible: prior?.visible ?? true,
        settings: {
          ...prior?.settings,
          label: setLocalized(prior?.settings.label, language, tag.label),
          url: tag.url,
        },
      };
    });
  };

  if (!existing) {
    if (!draft.enabled) return sections;
    const instance: SectionInstance = {
      id: crypto.randomUUID(),
      type: "top-tags",
      version: 1,
      visible: true,
      settings: {},
      blocks: buildBlocks([]),
    };
    // Directly under the header bar, where the storefront renders it.
    const headerBarIndex = sections.findIndex(
      (section) => section.type === "header-bar",
    );
    if (headerBarIndex < 0) return [...sections, instance];
    return [
      ...sections.slice(0, headerBarIndex + 1),
      instance,
      ...sections.slice(headerBarIndex + 1),
    ];
  }

  return sections.map((section) =>
    section === existing
      ? {
          ...section,
          visible: draft.enabled,
          blocks: buildBlocks(section.blocks ?? []),
        }
      : section,
  );
}

export function newTopTag(): TopTagDraft {
  return { id: crypto.randomUUID(), label: "", url: "" };
}
