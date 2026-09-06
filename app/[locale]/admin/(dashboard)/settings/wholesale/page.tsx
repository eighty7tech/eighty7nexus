"use client";

import { WholesaleSettingsTab } from "@/components/admin/settings/sections/wholesale-settings-tab";
import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { SectionLoader } from "@/components/admin/settings/section-loader";

export default function WholesaleSettingsPage() {
  const {
    isSaving,
    dirtySections,
    updateFieldInSection,
    saveSection,
  } = useAdminSettingsContext();

  return (
    <SectionLoader>
      {(loadedSettings) => (
        <WholesaleSettingsTab
          settings={loadedSettings}
          isSaving={isSaving}
          isDirty={dirtySections.has("wholesale")}
          updateField={(path, value) => {
            const field = path.startsWith("wholesale.") ? path.slice("wholesale.".length) : path;
            updateFieldInSection("wholesale", field, value);
          }}
          onSave={() => saveSection("wholesale", loadedSettings.wholesale)}
        />
      )}
    </SectionLoader>
  );
}
