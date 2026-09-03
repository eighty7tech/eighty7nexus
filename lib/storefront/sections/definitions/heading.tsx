import { ElectronicsSectionHeading } from "@/components/store/sections/themes/electronics-section-heading";
import { lt } from "../localized";
import type {
  LocalizedText,
  SectionDefinition,
  SectionRenderProps,
} from "../types";

/**
 * A standalone section heading — the design's "Top Collections" / "Find
 * Products" titles that sit ABOVE a run of sections rather than inside one.
 * Content sections keep their own titles; this exists for the surfaces
 * where one heading spans several sections.
 */

function title({ settings, ctx }: SectionRenderProps): string {
  return lt(settings.title as LocalizedText, ctx.locale, ctx.defaultLanguage);
}

/** Plain left-aligned heading, matching the base section headings. */
const plain: SectionDefinition["Render"] = (renderProps) => {
  const text = title(renderProps);
  if (!text) return null;
  return (
    <section className="pt-6 lg:pt-10">
      <div className="container mx-auto px-4">
        <h2 className="text-lg font-bold tracking-tight sm:text-2xl">
          {text}
        </h2>
      </div>
    </section>
  );
};

/** Centred, last word emphasised with the gradient — the Electronics look. */
const twoTone: SectionDefinition["Render"] = (renderProps) => {
  const text = title(renderProps);
  if (!text) return null;
  return (
    <section className="pt-6 lg:pt-10">
      <div className="container mx-auto px-4">
        <ElectronicsSectionHeading title={text} />
      </div>
    </section>
  );
};

export const heading: SectionDefinition = {
  type: "heading",
  version: 1,
  category: "content",
  // FIRST entry is the default every existing document falls back to — never
  // reorder this list, only append.
  variants: [
    { key: "plain", name: "Left-aligned", Render: plain },
    { key: "two-tone", name: "Centered two-tone", Render: twoTone },
  ],
  fields: [
    { key: "title", type: "text", translatable: true, default: "Heading" },
  ],
  Render: plain,
};
