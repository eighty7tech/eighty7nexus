"use client";

import { WhatsAppSettingsTab } from "@/components/admin/settings/sections/whatsapp-settings-tab";
import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { SectionLoader } from "@/components/admin/settings/section-loader";

export default function Page() {
  const { isSaving, dirtySections, updateNestedField, saveSection } =
    useAdminSettingsContext();

  return (
    <SectionLoader>
      {(loadedSettings) => (
        <WhatsAppSettingsTab
          settings={loadedSettings}
          isSaving={isSaving}
          isDirty={dirtySections.has("whatsapp")}
          updateNestedField={updateNestedField}
          onSave={() =>
            saveSection("whatsapp", loadedSettings.whatsapp)
          }
        />
      )}
    </SectionLoader>
  );
}
