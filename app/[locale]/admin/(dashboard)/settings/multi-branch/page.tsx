"use client";

import { MultiBranchSettingsTab } from "@/components/admin/settings/sections/multi-branch-settings-tab";
import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { SectionLoader } from "@/components/admin/settings/section-loader";
import { useAppSettings as usePublicAppSettings } from "@/providers/app-settings-provider";

export default function Page() {
  const { refreshSettings } = usePublicAppSettings();
  const {
    isSaving,
    dirtySections,
    updateFieldInSection,
    saveSection,
  } = useAdminSettingsContext();

  return (
    <SectionLoader>
      {(loadedSettings) => (
        <MultiBranchSettingsTab
          settings={loadedSettings}
          isSaving={isSaving}
          isDirty={dirtySections.has("multiBranch")}
          updateField={(path, value) => {
            const field = path.startsWith("multiBranch.") ? path.slice("multiBranch.".length) : path;
            updateFieldInSection("multiBranch", field, value);
          }}
          onSave={async () => {
            const ok = await saveSection("multiBranch", loadedSettings.multiBranch);
            if (ok) await refreshSettings();
          }}
        />
      )}
    </SectionLoader>
  );
}
