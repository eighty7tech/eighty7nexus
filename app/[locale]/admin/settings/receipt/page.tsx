"use client";

import { useMultiVendorMode } from "@/providers/app-settings-provider";
import { ReceiptSettingsTab } from "@/components/admin/settings/sections/receipt-settings-tab";
import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { SectionLoader } from "@/components/admin/settings/section-loader";

export default function Page() {
  const { refreshSettings } = useMultiVendorMode();
  const {
    isSaving,
    dirtySections,
    updateFieldInSection,
    saveSection,
  } = useAdminSettingsContext();

  return (
    <SectionLoader>
      {(loadedSettings) => (
        <ReceiptSettingsTab
          settings={loadedSettings}
          isSaving={isSaving}
          isDirty={dirtySections.has("pos")}
          updateField={(path, value) =>
            updateFieldInSection("pos", path, value)
          }
          onSave={async () => {
            const ok = await saveSection("pos", loadedSettings.pos || {});
            if (ok) await refreshSettings();
          }}
        />
      )}
    </SectionLoader>
  );
}
