"use client";

import { AppearanceSettingsTab } from "@/components/admin/settings/sections/appearance-settings-tab";
import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { SectionLoader } from "@/components/admin/settings/section-loader";
import type { Settings } from "@/components/admin/settings/types";
import { normalizeColorToHex } from "@/lib/appearance-colors";

// Brand assets live under `general.*` (every storefront/admin consumer reads
// them there), while colors/theme live under `appearance.*`. The Branding tab
// edits both, so on save we persist whichever of the two sections is dirty.
const GENERAL_SAVE_KEYS: Array<keyof Settings["general"]> = [
  "storeName",
  "storeDescription",
  "storeEmail",
  "storePhone",
  "storeDomain",
  "storeAddress",
  "logoUrl",
  "darkModeLogoUrl",
  "faviconUrl",
  "appIconUrl",
  "defaultLanguage",
  "defaultCurrency",
  "supportedLanguages",
  "supportedCurrencies",
  "timezone",
];

function pickGeneralForSave(general: Settings["general"]) {
  const out: Record<string, unknown> = {};
  for (const key of GENERAL_SAVE_KEYS) {
    out[key] = general?.[key];
  }
  return out;
}

// Fold any rgb()/rgba() or shorthand hex the color fields may still hold into a
// canonical hex before persisting (blur normalizes too, but a save fired before
// blur could otherwise store a raw rgb string the color pipeline can't read).
function normalizeAppearanceForSave(appearance: Settings["appearance"]) {
  const normalize = (value: string | undefined) =>
    normalizeColorToHex(value) ?? value;
  return {
    ...appearance,
    primaryColor: normalize(appearance?.primaryColor),
    secondaryColor: normalize(appearance?.secondaryColor),
    accentColor: normalize(appearance?.accentColor),
  };
}

export default function Page() {
  const { isSaving, dirtySections, updateNestedField, saveSection, saveSections } =
    useAdminSettingsContext();

  return (
    <SectionLoader>
      {(loadedSettings) => (
        <AppearanceSettingsTab
          settings={loadedSettings}
          isSaving={isSaving}
          isDirty={
            dirtySections.has("appearance") || dirtySections.has("general")
          }
          updateNestedField={updateNestedField}
          onSave={() => {
            const generalDirty = dirtySections.has("general");
            const appearanceDirty = dirtySections.has("appearance");

            // Only one section touched → single-section save (keeps the
            // general-tab currency/vendor side effects intact when relevant).
            if (appearanceDirty && !generalDirty) {
              return saveSection(
                "appearance",
                normalizeAppearanceForSave(loadedSettings.appearance),
              );
            }
            if (generalDirty && !appearanceDirty) {
              return saveSection(
                "general",
                pickGeneralForSave(loadedSettings.general),
              );
            }
            if (generalDirty && appearanceDirty) {
              return saveSections({
                general: pickGeneralForSave(loadedSettings.general),
                appearance: normalizeAppearanceForSave(loadedSettings.appearance),
              });
            }
            return Promise.resolve(true);
          }}
        />
      )}
    </SectionLoader>
  );
}
