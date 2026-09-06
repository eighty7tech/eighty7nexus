"use client";

import { TrackOrderSettingsTab } from "@/components/admin/settings/sections/track-order-settings-tab";
import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { SectionLoader } from "@/components/admin/settings/section-loader";
import type { Settings } from "@/components/admin/settings/types";

function pickOnlineStoreForSave(onlineStore: Settings["onlineStore"]) {
  const out: Record<string, unknown> = {};
  if (onlineStore) {
    if (onlineStore.activeTheme) out.activeTheme = onlineStore.activeTheme;
    if (onlineStore.themeSettings) out.themeSettings = onlineStore.themeSettings;
    if (onlineStore.floatingTabs) out.floatingTabs = onlineStore.floatingTabs;
    if (onlineStore.trackOrder) out.trackOrder = onlineStore.trackOrder;
  }
  return out;
}

export default function Page() {
  const { isSaving, dirtySections, updateNestedField, saveSection } =
    useAdminSettingsContext();

  return (
    <SectionLoader>
      {(loadedSettings) => (
        <TrackOrderSettingsTab
          settings={loadedSettings}
          isSaving={isSaving}
          isDirty={dirtySections.has("onlineStore")}
          updateNestedField={updateNestedField}
          onSave={() => {
            return saveSection(
              "onlineStore",
              pickOnlineStoreForSave(loadedSettings.onlineStore),
            );
          }}
        />
      )}
    </SectionLoader>
  );
}
