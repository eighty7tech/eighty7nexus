"use client";

import { useAdminSettingsContext } from "@/components/admin/settings/admin-settings-context";
import { SectionLoader } from "@/components/admin/settings/section-loader";
import { SystemManagementSettingsTab } from "@/components/admin/settings/sections/system-management-settings-tab";
import type { Settings } from "@/components/admin/settings/types";

export default function SystemManagementSettingsPage() {
  const { isSaving, dirtySections, updateNestedField, saveSection } = useAdminSettingsContext();

  return (
    <SectionLoader>
      {(settings: Settings) => (
        <SystemManagementSettingsTab
          settings={settings}
          isSaving={isSaving}
          isDirty={dirtySections.has("system-management")}
          updateNestedField={updateNestedField}
          onSave={() => saveSection("system-management", {})}
        />
      )}
    </SectionLoader>
  );
}
